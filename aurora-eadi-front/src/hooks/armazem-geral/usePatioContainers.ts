import { useQuery } from '@tanstack/react-query';
import { originContainersService } from '@/services/armazem-geral/origin-containers.service';
import { ownedContainersService } from '@/services/armazem-geral/owned-containers.service';
import { cargoService } from '@/services/armazem-geral/cargo.service';
import type { OperationalContainerStatus, WarehouseCargo } from '@/types/armazem-geral';

export interface PatioContainer {
  id: string;
  assetType: 'ORIGEM' | 'PRÓPRIO';
  containerNumber: string;
  containerType: string | null;
  location: string | null;
  status: string;
  entryDate: string | null;
  ownerOrSupplier: string | null; // Cliente (origem: no container / próprio: na carga)
  isFull: boolean;
  originalData: any; // Keep the original object just in case
}

interface UsePatioContainersParams {
  page?: number;
  limit?: number;
  search?: string;
  customerIds?: string[];
}

function isCargoNewer(a: WarehouseCargo, b: WarehouseCargo) {
  const dateA = new Date((a.entryDate ?? a.createdAt) as any).getTime();
  const dateB = new Date((b.entryDate ?? b.createdAt) as any).getTime();
  return dateA > dateB;
}

export function usePatioContainers(params: UsePatioContainersParams) {
  return useQuery({
    queryKey: ['armazem-geral', 'patio', params],
    queryFn: async () => {
      const [originResult, ownedResult] = await Promise.allSettled([
        originContainersService.findAll({
          page: params.page,
          limit: params.limit,
          search: params.search,
          customerIds: params.customerIds,
          status: 'IN_WAREHOUSE' as OperationalContainerStatus,
        }),
        ownedContainersService.findAll({
          page: params.page,
          limit: params.limit,
          search: params.search,
          customerIds: params.customerIds,
          inPatio: true,
        }),
      ]);

      const originRes = originResult.status === 'fulfilled' ? originResult.value : null;
      const ownedRes = ownedResult.status === 'fulfilled' ? ownedResult.value : null;

      if (!originRes && !ownedRes) {
        const originReason =
          originResult.status === 'rejected'
            ? originResult.reason instanceof Error
              ? originResult.reason.message
              : String(originResult.reason)
            : null;
        const ownedReason =
          ownedResult.status === 'rejected'
            ? ownedResult.reason instanceof Error
              ? ownedResult.reason.message
              : String(ownedResult.reason)
            : null;

        throw new Error(
          `Erro ao carregar o pátio. Origem: ${originReason ?? 'N/A'}. Próprio: ${ownedReason ?? 'N/A'}.`,
        );
      }

      const originContainers = originRes?.data || [];
      const ownedContainers = ownedRes?.data || [];

      const containerIds = originContainers.map((c) => c.id);
      const ownedContainerIds = ownedContainers.map((c) => c.id);

      const cargos: WarehouseCargo[] = [];
      if (containerIds.length > 0 || ownedContainerIds.length > 0) {
        const cargosRes = await cargoService
          .findAll({
            page: 1,
            limit: 200,
            containerIds: containerIds.length > 0 ? containerIds.join(',') : undefined,
            ownedContainerIds: ownedContainerIds.length > 0 ? ownedContainerIds.join(',') : undefined,
            activeOnly: true,
          })
          .catch(() => null);

        cargos.push(...(cargosRes?.data || []));
      }

      const cargoByContainerId = new Map<string, WarehouseCargo>();
      const cargoByOwnedContainerId = new Map<string, WarehouseCargo>();

      for (const cargo of cargos) {
        if (cargo.containerId) {
          const current = cargoByContainerId.get(cargo.containerId);
          if (!current || isCargoNewer(cargo, current)) cargoByContainerId.set(cargo.containerId, cargo);
        }
        if (cargo.ownedContainerId) {
          const current = cargoByOwnedContainerId.get(cargo.ownedContainerId);
          if (!current || isCargoNewer(cargo, current)) cargoByOwnedContainerId.set(cargo.ownedContainerId, cargo);
        }
      }

      const normalizedOrigin: PatioContainer[] = originContainers.map((c) => ({
        id: c.id,
        assetType: 'ORIGEM',
        containerNumber: c.containerNumber,
        containerType: c.containerType,
        location: c.location,
        status: c.status,
        entryDate: c.entryDate,
        ownerOrSupplier: c.customer?.name || cargoByContainerId.get(c.id)?.customer?.name || null,
        // Regra: container de origem só está CHEIO quando vinculado a uma carga ativa
        isFull: !!cargoByContainerId.get(c.id),
        originalData: c,
      }));

      const normalizedOwned: PatioContainer[] = ownedContainers.map((c) => {
        const cargo = cargoByOwnedContainerId.get(c.id);
        const isFull = !!cargo;

        return {
          id: c.id,
          assetType: 'PRÓPRIO',
          containerNumber: c.containerNumber || c.code || '-',
          containerType: c.containerType,
          location: c.location,
          status: c.status,
          entryDate: c.createdAt,
          ownerOrSupplier: isFull ? (cargo?.customer?.name ?? null) : null,
          isFull,
          originalData: { ...c, cargo },
        };
      });

      const allContainers = [...normalizedOrigin, ...normalizedOwned];

      allContainers.sort((a, b) => {
        const dateA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
        const dateB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
        return dateB - dateA;
      });

      const originTotal = originRes?.pagination?.total || 0;
      const ownedTotal = ownedRes?.pagination?.total || 0;
      const total = originTotal + ownedTotal;

      return {
        data: allContainers,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total,
          totalPages: Math.ceil(total / (params.limit || 10)),
          hasNext: (originRes?.pagination?.hasNext || ownedRes?.pagination?.hasNext) ?? false,
          hasPrev: (originRes?.pagination?.hasPrev || ownedRes?.pagination?.hasPrev) ?? false,
        },
      };
    },
  });
}
