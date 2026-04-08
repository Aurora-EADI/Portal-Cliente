import {
  AuditAction,
  OperationalContainerMovementType,
  OperationalContainerStatus,
  Prisma,
  TransshipmentStatus,
} from "@prisma/client";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { ArmazemGeralAuditService } from "../armazem-geral-audit.service";
import { ArmazemGeralContextService } from "../armazem-geral-context.service";
import { CreateTransshipmentDto } from "./dto/create-transshipment.dto";
import { CompleteTransshipmentDto } from "./dto/complete-transshipment.dto";
import { UpdateTransshipmentDto } from "./dto/update-transshipment.dto";

interface FindAllParams {
  page?: number;
  limit?: number;
  status?: string;
}

@Injectable()
export class WarehouseGeneralTransshipmentsService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
    private readonly audit: ArmazemGeralAuditService,
  ) {}

  async create(dto: CreateTransshipmentDto, performedByUserId: string) {
    const warehouseId = await this.context.getWarehouseId();

    const container = await this.prisma.operationalContainer.findUnique({
      where: { id: dto.containerId },
    });
    if (!container || container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container nÃ£o encontrado.");
    }

    if (container.status === OperationalContainerStatus.OUT) {
      throw new BadRequestException(
        "NÃ£o Ã© possÃ­vel iniciar transbordo para container com status OUT.",
      );
    }

    if (container.status === OperationalContainerStatus.TRANSSHIPMENT) {
      throw new ConflictException("Container jÃ¡ estÃ¡ em TRANSSHIPMENT.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transshipment = await tx.warehouseTransshipment.create({
        data: {
          warehouseId,
          containerId: container.id,
          cargoId: dto.cargoId ?? null,
          originalSeal: dto.originalSeal ?? null,
          newSeal: dto.newSeal ?? null,
          reason: dto.reason ?? null,
          destinationContainerId: dto.destinationContainerId ?? null,
          destinationContainerNumber: dto.destinationContainerNumber ?? null,
          responsibleName: dto.responsibleName ?? null,
          responsibleMatricula: dto.responsibleMatricula ?? null,
          responsibleCpf: dto.responsibleCpf ?? null,
          observations: dto.observations ?? null,
          status: TransshipmentStatus.PENDING,
        },
      });

      const updatedContainer = await tx.operationalContainer.update({
        where: { id: container.id },
        data: {
          status: OperationalContainerStatus.TRANSSHIPMENT,
          movements: {
            create: {
              type: OperationalContainerMovementType.STATUS_CHANGE,
              fromStatus: container.status,
              toStatus: OperationalContainerStatus.TRANSSHIPMENT,
              location: container.location,
              performedByUserId,
            },
          },
        },
      });

      return { transshipment, updatedContainer };
    });

    await this.audit.log({
      entityType: "WarehouseTransshipment",
      entityId: result.transshipment.id,
      action: AuditAction.CREATE,
      after: result.transshipment as unknown as Prisma.InputJsonValue,
      performedByUserId,
    });

    await this.audit.log({
      entityType: "OperationalContainer",
      entityId: container.id,
      action: AuditAction.STATUS_CHANGE,
      before: { status: container.status },
      after: { status: result.updatedContainer.status },
      performedByUserId,
    });

    return result.transshipment;
  }

  async complete(
    id: string,
    dto: CompleteTransshipmentDto,
    performedByUserId: string,
  ) {
    const warehouseId = await this.context.getWarehouseId();

    const existing = await this.prisma.warehouseTransshipment.findUnique({
      where: { id },
      include: { container: true },
    });
    if (!existing || existing.warehouseId !== warehouseId) {
      throw new NotFoundException("Transbordo nÃ£o encontrado.");
    }

    if (existing.status !== TransshipmentStatus.PENDING) {
      throw new ConflictException("Transbordo nÃ£o estÃ¡ em estado PENDING.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Atualizar status do transbordo
      const updatedTransshipment = await tx.warehouseTransshipment.update({
        where: { id },
        data: {
          status: TransshipmentStatus.COMPLETED,
          newSeal: dto.newSeal ?? existing.newSeal,
          responsibleName: dto.responsibleName ?? existing.responsibleName,
          observations: dto.observations ?? existing.observations,
        },
      });

      // 2. Liberar o container de ORIGEM (volta para status normal no pátio)
      const updatedContainer = await tx.operationalContainer.update({
        where: { id: existing.containerId },
        data: {
          status: OperationalContainerStatus.IN_WAREHOUSE,
          movements: {
            create: {
              type: OperationalContainerMovementType.STATUS_CHANGE,
              fromStatus: OperationalContainerStatus.TRANSSHIPMENT,
              toStatus: OperationalContainerStatus.IN_WAREHOUSE,
              location: existing.container.location,
              performedByUserId,
            },
          },
        },
      });

      // 3. Vincular oficialmente a CARGA ao container de DESTINO
      if (existing.cargoId && existing.destinationContainerId) {
        // Tentar encontrar o destino como Container Operacional (Pátio)
        const destOp = await tx.operationalContainer.findUnique({
          where: { id: existing.destinationContainerId },
        });

        if (destOp) {
          await tx.warehouseCargo.update({
            where: { id: existing.cargoId },
            data: {
              containerId: existing.destinationContainerId,
              ownedContainerId: null,
            },
          });
        } else {
          // Tentar encontrar o destino como Container Próprio (Aurora)
          const destOwned = await tx.warehouseOwnedContainer.findUnique({
            where: { id: existing.destinationContainerId },
          });

          if (destOwned) {
            await tx.warehouseCargo.update({
              where: { id: existing.cargoId },
              data: {
                containerId: null,
                ownedContainerId: existing.destinationContainerId,
              },
            });

            // Marcar o container próprio como em uso
            await tx.warehouseOwnedContainer.update({
              where: { id: existing.destinationContainerId },
              data: { status: "IN_USE" as any },
            });
          }
        }
      }

      return { updatedTransshipment, updatedContainer };
    });

    // Registrar auditoria da finalização do transbordo
    await this.audit.log({
      entityType: "WarehouseTransshipment",
      entityId: existing.id,
      action: AuditAction.STATUS_CHANGE,
      before: { status: existing.status, newSeal: existing.newSeal },
      after: {
        status: result.updatedTransshipment.status,
        newSeal: result.updatedTransshipment.newSeal,
      },
      performedByUserId,
    });

    // Registrar auditoria da mudança de container na carga
    if (existing.cargoId && existing.destinationContainerId) {
      await this.audit.log({
        entityType: "WarehouseCargo",
        entityId: existing.cargoId,
        action: AuditAction.UPDATE,
        before: { containerId: existing.containerId },
        after: { containerId: existing.destinationContainerId },
        performedByUserId,
      });
    }

    // Registrar auditoria da liberação do container de origem
    await this.audit.log({
      entityType: "OperationalContainer",
      entityId: existing.containerId,
      action: AuditAction.STATUS_CHANGE,
      before: { status: OperationalContainerStatus.TRANSSHIPMENT },
      after: { status: result.updatedContainer.status },
      performedByUserId,
    });

    return result.updatedTransshipment;
  }

  async update(id: string, dto: UpdateTransshipmentDto, performedByUserId: string) {
    const warehouseId = await this.context.getWarehouseId();

    const existing = await this.prisma.warehouseTransshipment.findUnique({
      where: { id },
    });
    if (!existing || existing.warehouseId !== warehouseId) {
      throw new NotFoundException("Transbordo não encontrado.");
    }

    if (existing.status !== TransshipmentStatus.PENDING) {
      throw new ConflictException("Apenas transbordos pendentes podem ser editados.");
    }

    const updated = await this.prisma.warehouseTransshipment.update({
      where: { id },
      data: {
        newSeal: dto.newSeal !== undefined ? dto.newSeal : undefined,
        reason: dto.reason !== undefined ? dto.reason : undefined,
        destinationContainerId: dto.destinationContainerId !== undefined ? dto.destinationContainerId : undefined,
        destinationContainerNumber: dto.destinationContainerNumber !== undefined ? dto.destinationContainerNumber : undefined,
        responsibleName: dto.responsibleName !== undefined ? dto.responsibleName : undefined,
        responsibleMatricula: dto.responsibleMatricula !== undefined ? dto.responsibleMatricula : undefined,
        responsibleCpf: dto.responsibleCpf !== undefined ? dto.responsibleCpf : undefined,
        observations: dto.observations !== undefined ? dto.observations : undefined,
      },
    });

    await this.audit.log({
      entityType: "WarehouseTransshipment",
      entityId: existing.id,
      action: AuditAction.UPDATE,
      before: existing as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
      performedByUserId,
    });

    return updated;
  }

  async findAll(params: FindAllParams = {}) {
    const warehouseId = await this.context.getWarehouseId();
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WarehouseTransshipmentWhereInput = { warehouseId };
    if (status) {
      where.status = status as any;
    }

    const [data, total] = await Promise.all([
      this.prisma.warehouseTransshipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          container: { select: { id: true, containerNumber: true, status: true } },
          cargo: { select: { id: true, description: true } },
        },
      }),
      this.prisma.warehouseTransshipment.count({ where }),
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
    const item = await this.prisma.warehouseTransshipment.findUnique({
      where: { id },
      include: {
        container: { select: { id: true, containerNumber: true, status: true } },
        cargo: { select: { id: true, description: true } },
      },
    });
    if (!item || item.warehouseId !== warehouseId) {
      throw new NotFoundException("Transbordo nÃ£o encontrado.");
    }
    return item;
  }
}
