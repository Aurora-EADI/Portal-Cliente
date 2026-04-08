import {
  AuditAction,
  Prisma,
} from "@prisma/client";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { ArmazemGeralAuditService } from "../armazem-geral-audit.service";
import { ArmazemGeralContextService } from "../armazem-geral-context.service";
import { CreateWarehouseCargoDto } from "./dto/create-warehouse-cargo.dto";
import { UpdateWarehouseCargoDto } from "./dto/update-warehouse-cargo.dto";

interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  containerIds?: string;
  ownedContainerIds?: string;
  activeOnly?: boolean;
}

@Injectable()
export class WarehouseGeneralCargoService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
    private readonly audit: ArmazemGeralAuditService,
  ) {}

  async create(dto: CreateWarehouseCargoDto) {
    const warehouseId = await this.context.getWarehouseId();

    let containerId: string | null = dto.containerId ?? null;
    let entryDate = dto.entryDate ? new Date(dto.entryDate) : null;
    let exitDate = dto.exitDate ? new Date(dto.exitDate) : null;
    let location = dto.location ?? null;

    if (containerId) {
      const container = await this.prisma.operationalContainer.findUnique({
        where: { id: containerId },
        select: { id: true, warehouseId: true, entryDate: true, exitDate: true, location: true },
      });
      if (!container || container.warehouseId !== warehouseId) {
        throw new NotFoundException("Container não encontrado.");
      }
      
      // Default dates and location from container if not provided
      if (!entryDate && container.entryDate) entryDate = container.entryDate;
      if (!exitDate && container.exitDate) exitDate = container.exitDate;
      if (!location && container.location) location = container.location;
    }

    const cargo = await this.prisma.warehouseCargo.create({
      data: {
        warehouseId,
        containerId,
        customerId: dto.customerId ?? null,
        description: dto.description,
        cargoType: dto.cargoType ?? null,
        weightKg: dto.weightKg ?? null,
        quantity: dto.quantity ?? 1,
        dangerous: dto.dangerous ?? false,
        documentType: dto.documentType ?? null,
        documentNumber: dto.documentNumber ?? null,
        entryDate,
        exitDate,
        entryContainerId: dto.entryContainerId ?? null,
        exitContainerId: dto.exitContainerId ?? null,
        packagingType: dto.packagingType ?? null,
        volume: dto.volume ?? null,
        location,
      },
    });

    await this.audit.log({
      entityType: "WarehouseCargo",
      entityId: cargo.id,
      action: AuditAction.CREATE,
      after: cargo as unknown as Prisma.InputJsonValue,
    });

    return cargo;
  }

  async findAll(params: FindAllParams = {}) {
    const warehouseId = await this.context.getWarehouseId();
    const { page = 1, limit = 20, search, containerIds, ownedContainerIds, activeOnly } = params;
    const skip = (page - 1) * limit;

    const parsedContainerIds = parseIdList(containerIds);
    const parsedOwnedContainerIds = parseIdList(ownedContainerIds);

    const and: Prisma.WarehouseCargoWhereInput[] = [];

    if (search) {
      and.push({
        OR: [
          { description: { contains: search, mode: "insensitive" } },
          { cargoType: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if ((parsedContainerIds?.length ?? 0) > 0 || (parsedOwnedContainerIds?.length ?? 0) > 0) {
      const or: Prisma.WarehouseCargoWhereInput[] = [];
      if ((parsedContainerIds?.length ?? 0) > 0) {
        or.push({ containerId: { in: parsedContainerIds! } });
      }
      if ((parsedOwnedContainerIds?.length ?? 0) > 0) {
        or.push({ ownedContainerId: { in: parsedOwnedContainerIds! } });
      }
      and.push({ OR: or });
    }

    if (activeOnly) {
      and.push({ exitDate: null });
    }

    const where: Prisma.WarehouseCargoWhereInput =
      and.length > 0
        ? { warehouseId, AND: and }
        : { warehouseId };

    const [data, total] = await Promise.all([
      this.prisma.warehouseCargo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          container: {
            select: { id: true, containerNumber: true, status: true, originalSeal: true },
          },
          ownedContainer: {
            select: { id: true, code: true, containerNumber: true, status: true },
          },
          customer: {
            select: { id: true, name: true, corporateName: true },
          },
          entryContainer: {
            select: { id: true, containerNumber: true, originalSeal: true },
          },
          exitContainer: {
            select: { id: true, containerNumber: true },
          },
        },
      }),
      this.prisma.warehouseCargo.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const warehouseId = await this.context.getWarehouseId();
    const cargo = await this.prisma.warehouseCargo.findUnique({
      where: { id },
      include: {
        container: {
          select: { id: true, containerNumber: true, status: true, originalSeal: true },
        },
        ownedContainer: {
          select: { id: true, code: true, containerNumber: true, status: true },
        },
        customer: {
          select: { id: true, name: true, corporateName: true },
        },
        entryContainer: {
          select: { id: true, containerNumber: true, originalSeal: true },
        },
        exitContainer: {
          select: { id: true, containerNumber: true },
        },
        damages: true,
      },
    });
    if (!cargo || cargo.warehouseId !== warehouseId) {
      throw new NotFoundException("Carga nÃ£o encontrada.");
    }
    return cargo;
  }

  async update(id: string, dto: UpdateWarehouseCargoDto) {
    const warehouseId = await this.context.getWarehouseId();
    const existing = await this.prisma.warehouseCargo.findUnique({
      where: { id },
    });
    if (!existing || existing.warehouseId !== warehouseId) {
      throw new NotFoundException("Carga nÃ£o encontrada.");
    }

    if (dto.containerId) {
      const container = await this.prisma.operationalContainer.findUnique({
        where: { id: dto.containerId },
        select: { id: true, warehouseId: true },
      });
      if (!container || container.warehouseId !== warehouseId) {
        throw new NotFoundException("Container nÃ£o encontrado.");
      }
    }

    const updated = await this.prisma.warehouseCargo.update({
      where: { id },
      data: {
        description: dto.description,
        cargoType: dto.cargoType,
        weightKg: dto.weightKg,
        quantity: dto.quantity,
        dangerous: dto.dangerous,
        containerId: dto.containerId,
        customerId: dto.customerId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
        exitDate: dto.exitDate ? new Date(dto.exitDate) : undefined,
        entryContainerId: dto.entryContainerId,
        exitContainerId: dto.exitContainerId,
        packagingType: dto.packagingType,
        volume: dto.volume,
        location: dto.location,
      },
    });

    await this.audit.log({
      entityType: "WarehouseCargo",
      entityId: updated.id,
      action: AuditAction.UPDATE,
      before: existing as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
    });

    return updated;
  }

  async remove(id: string) {
    const warehouseId = await this.context.getWarehouseId();
    const existing = await this.prisma.warehouseCargo.findUnique({
      where: { id },
    });
    if (!existing || existing.warehouseId !== warehouseId) {
      throw new NotFoundException("Carga nÃ£o encontrada.");
    }

    try {
      await this.prisma.warehouseCargo.delete({ where: { id } });
    } catch {
      throw new BadRequestException(
        "NÃ£o foi possÃ­vel remover a carga (verifique vÃ­nculos).",
      );
    }
  }
}

function parseIdList(value?: string): string[] | undefined {
  if (!value) return undefined;
  const ids = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 200);
  return ids.length > 0 ? ids : undefined;
}
