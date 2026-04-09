import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AuditAction,
  DamageSeverity,
  DamageStatus,
  OperationalContainerMovementType,
  OperationalContainerStatus,
} from "@prisma/client";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { ArmazemGeralAuditService } from "../armazem-geral-audit.service";
import { ArmazemGeralContextService } from "../armazem-geral-context.service";
import { ContainerQueryDto } from "./dto/container-query.dto";
import { EntryContainerDto } from "./dto/entry-container.dto";
import { ExitContainerDto } from "./dto/exit-container.dto";
import { UpdateContainerLocationDto } from "./dto/update-container-location.dto";
import { UpdateOperationalContainerDto } from "./dto/update-operational-container.dto";

@Injectable()
export class ContainersService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
    private readonly audit: ArmazemGeralAuditService,
  ) { }

  private async generateNumber(
    warehouseId: string,
    field: "entryNumber" | "exitNumber",
  ): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const lastRecord = await this.prisma.operationalContainer.findFirst({
      where: {
        warehouseId,
        [field]: {
          startsWith: `${year}/`,
        },
      },
      orderBy: {
        [field]: "desc",
      },
      select: {
        [field]: true,
      },
    });

    let nextSequence = 1;
    if (lastRecord) {
      const lastValue = (lastRecord as any)[field] as string | null;
      if (lastValue) {
        const parts = lastValue.split("/");
        if (parts.length === 2) {
          const seqNum = parseInt(parts[1], 10);
          if (!isNaN(seqNum)) {
            nextSequence = seqNum + 1;
          }
        }
      }
    }

    return `${year}/${nextSequence.toString().padStart(5, "0")}`;
  }

  async entry(dto: EntryContainerDto, performedByUserId: string) {
    const warehouseId = await this.context.getWarehouseId();
    const containerNumber = dto.containerNumber.trim().toUpperCase();

    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });
      if (!customer) {
        throw new NotFoundException("Cliente (customerId) não encontrado.");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.operationalContainer.findFirst({
        where: { warehouseId, containerNumber },
      });

      if (!existing) {
        const entryNumber = await this.generateNumber(warehouseId, "entryNumber");

        const created = await tx.operationalContainer.create({
          data: {
            warehouseId,
            containerNumber,
            containerType: dto.containerType ?? null,
            entryNumber,
            entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
            freeTimeDate: dto.freeTimeDate ? new Date(dto.freeTimeDate) : null,
            // Regra de negocio: container so e CHEIO quando houver carga ativa vinculada
            isFull: false,
            origin: dto.origin ?? null,
            destination: dto.destination ?? null,
            originalSeal: dto.originalSeal ?? null,
            observations: dto.observations ?? null,
            status: OperationalContainerStatus.IN_WAREHOUSE,
            location: dto.location ?? null,
            customerId: dto.customerId ?? null,
            movements: {
              create: {
                type: OperationalContainerMovementType.ENTRY,
                fromStatus: null,
                toStatus: OperationalContainerStatus.IN_WAREHOUSE,
                location: dto.location ?? null,
                carrierId: dto.carrierId ?? null,
                driverId: dto.driverId ?? null,
                vehicleId: dto.vehicleId ?? null,
                performedByUserId,
              },
            },
          },
          include: { movements: { orderBy: { createdAt: "desc" }, take: 1 } },
        });

        // Handle Avarias
        if (dto.avarias && dto.avarias.length > 0) {
          await tx.warehouseDamage.createMany({
            data: dto.avarias.map((avaria) => ({
              warehouseId,
              containerId: created.id,
              severity: DamageSeverity.MEDIUM,
              status: DamageStatus.OPEN,
              description: avaria,
              photoObjectKeys: [],
            })),
          });
        }

        await this.audit.log({
          entityType: "OperationalContainer",
          entityId: created.id,
          action: AuditAction.CREATE,
          after: {
            containerNumber: created.containerNumber,
            status: created.status,
            location: created.location,
            customerId: created.customerId,
          },
          performedByUserId,
        });

        return created;
      }

      if (existing.status === OperationalContainerStatus.IN_WAREHOUSE) {
        throw new ConflictException("Container já está no armazém.");
      }

      const updated = await tx.operationalContainer.update({
        where: { id: existing.id },
        data: {
          status: OperationalContainerStatus.IN_WAREHOUSE,
          location: dto.location ?? existing.location,
          containerType: dto.containerType ?? existing.containerType,
          customerId: dto.customerId ?? (existing as any).customerId,
          movements: {
            create: {
              type: OperationalContainerMovementType.ENTRY,
              fromStatus: existing.status,
              toStatus: OperationalContainerStatus.IN_WAREHOUSE,
              location: dto.location ?? existing.location,
              carrierId: dto.carrierId ?? null,
              driverId: dto.driverId ?? null,
              vehicleId: dto.vehicleId ?? null,
              performedByUserId,
            },
          },
        },
        include: { movements: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      await this.audit.log({
        entityType: "OperationalContainer",
        entityId: updated.id,
        action: AuditAction.STATUS_CHANGE,
        before: { status: existing.status, location: existing.location },
        after: { status: updated.status, location: updated.location },
        performedByUserId,
      });

      return updated;
    });
  }

  async exit(id: string, dto: ExitContainerDto, performedByUserId: string) {
    const warehouseId = await this.context.getWarehouseId();
    const container = await this.prisma.operationalContainer.findUnique({
      where: { id },
    });
    if (!container) {
      throw new NotFoundException("Container não encontrado.");
    }
    if (container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container não encontrado.");
    }

    if (container.status === OperationalContainerStatus.OUT) {
      throw new ConflictException("Container já está marcado como OUT.");
    }

    const exitNumber = await this.generateNumber(warehouseId, "exitNumber");

    const updated = await this.prisma.operationalContainer.update({
      where: { id },
      data: {
        status: OperationalContainerStatus.OUT,
        exitNumber,
        exitDate: new Date(),
        movements: {
          create: {
            type: OperationalContainerMovementType.EXIT,
            fromStatus: container.status,
            toStatus: OperationalContainerStatus.OUT,
            location: container.location,
            carrierId: dto.carrierId ?? null,
            driverId: dto.driverId ?? null,
            vehicleId: dto.vehicleId ?? null,
            performedByUserId,
          },
        },
      },
      include: { movements: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    await this.audit.log({
      entityType: "OperationalContainer",
      entityId: updated.id,
      action: AuditAction.STATUS_CHANGE,
      before: { status: container.status, location: container.location },
      after: { status: updated.status, location: updated.location },
      performedByUserId,
    });

    return updated;
  }

  async updateLocation(
    id: string,
    dto: UpdateContainerLocationDto,
    performedByUserId: string,
  ) {
    const warehouseId = await this.context.getWarehouseId();
    const container = await this.prisma.operationalContainer.findUnique({
      where: { id },
    });
    if (!container) {
      throw new NotFoundException("Container não encontrado.");
    }
    if (container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container não encontrado.");
    }

    if (container.status !== OperationalContainerStatus.IN_WAREHOUSE) {
      throw new BadRequestException(
        "Só é possível atualizar localização quando status for IN_WAREHOUSE.",
      );
    }

    const updated = await this.prisma.operationalContainer.update({
      where: { id },
      data: {
        location: dto.location,
        movements: {
          create: {
            type: OperationalContainerMovementType.LOCATION_UPDATE,
            fromStatus: container.status,
            toStatus: container.status,
            location: dto.location,
            performedByUserId,
          },
        },
      },
      include: { movements: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    await this.audit.log({
      entityType: "OperationalContainer",
      entityId: updated.id,
      action: AuditAction.UPDATE,
      before: { location: container.location },
      after: { location: updated.location },
      performedByUserId,
    });

    return updated;
  }

  async findAll(query: ContainerQueryDto) {
    const warehouseId = await this.context.getWarehouseId();
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = { warehouseId };
    if (query.search) {
      const s = query.search.trim().toUpperCase();
      where.containerNumber = { contains: s, mode: "insensitive" };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.customerId) {
      where.customerId = query.customerId;
    }
    if (query.customerIds && query.customerIds.length > 0) {
      where.customerId = { in: query.customerIds };
    }

    const [data, total] = await Promise.all([
      this.prisma.operationalContainer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, document: true } },
          cargos: {
            where: { exitDate: null },
            select: { id: true },
            take: 1,
          },
          damages: {
            where: { status: DamageStatus.OPEN },
          },
        },
      }),
      this.prisma.operationalContainer.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: data.map(({ cargos, ...container }) => ({
        ...container,
        isFull: (cargos?.length ?? 0) > 0,
      })),
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
    const container = await this.prisma.operationalContainer.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, document: true } },
        cargos: {
          where: { exitDate: null },
          select: { id: true },
          take: 1,
        },
        movements: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            carrier: true,
            driver: true,
            vehicle: true,
            performedByUser: { select: { id: true, name: true, email: true } },
          },
        },
        damages: {
          where: { status: DamageStatus.OPEN },
        },
      },
    });

    if (!container) {
      throw new NotFoundException("Container não encontrado.");
    }
    if (container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container não encontrado.");
    }

    const { cargos, ...rest } = container as any;
    return {
      ...rest,
      isFull: (cargos?.length ?? 0) > 0,
    };
  }

  async getMovements(id: string) {
    const warehouseId = await this.context.getWarehouseId();
    const container = await this.prisma.operationalContainer.findUnique({
      where: { id },
      select: { id: true, warehouseId: true },
    });
    if (!container) {
      throw new NotFoundException("Container não encontrado.");
    }
    if (container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container não encontrado.");
    }

    return this.prisma.operationalContainerMovement.findMany({
      where: { containerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        carrier: true,
        driver: true,
        vehicle: true,
        performedByUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(
    id: string,
    dto: UpdateOperationalContainerDto,
    performedByUserId: string,
  ) {
    const warehouseId = await this.context.getWarehouseId();
    const container = await this.prisma.operationalContainer.findUnique({
      where: { id },
    });

    if (!container) {
      throw new NotFoundException("Container não encontrado.");
    }
    if (container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container não encontrado.");
    }

    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });
      if (!customer) {
        throw new NotFoundException("Cliente não encontrado.");
      }
    }

    const data: any = {
      containerType: dto.containerType,
      customerId: dto.customerId,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
      freeTimeDate: dto.freeTimeDate ? new Date(dto.freeTimeDate) : undefined,
      origin: dto.origin,
      destination: dto.destination,
      originalSeal: dto.originalSeal,
      location: dto.location,
      observations: dto.observations,
    };

    // Remove undefined fields
    Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.operationalContainer.update({
        where: { id },
        data,
      });

      if (dto.avarias !== undefined) {
        // Simple sync: delete old and create new
        await tx.warehouseDamage.deleteMany({
          where: { containerId: id },
        });

        if (dto.avarias.length > 0) {
          await tx.warehouseDamage.createMany({
            data: dto.avarias.map((avaria) => ({
              warehouseId,
              containerId: id,
              severity: DamageSeverity.MEDIUM,
              status: DamageStatus.OPEN,
              description: avaria,
              photoObjectKeys: [],
            })),
          });
        }
      }

      await this.audit.log({
        entityType: "OperationalContainer",
        entityId: updated.id,
        action: AuditAction.UPDATE,
        before: container as any,
        after: updated as any,
        performedByUserId,
      });

      return updated;
    });
  }
}
