import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditAction, DamageSeverity, DamageStatus, WarehouseOwnedContainerStatus } from "@prisma/client";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { ArmazemGeralAuditService } from "../armazem-geral-audit.service";
import { ArmazemGeralContextService } from "../armazem-geral-context.service";
import { CreateContainerProprioDto } from "./dto/create-container-proprio.dto";
import { DispatchOwnedContainerDto } from "./dto/dispatch-owned-container.dto";
import { ReturnOwnedContainerDto } from "./dto/return-owned-container.dto";
import { UpdateContainerProprioDto } from "./dto/update-container-proprio.dto";

interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  inPatio?: boolean;
  customerIds?: string[];
}

@Injectable()
export class ContainersPropriosService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
    private readonly audit: ArmazemGeralAuditService,
  ) {}

  async generateNextCode(): Promise<{ code: string }> {
    const warehouseId = await this.context.getWarehouseId();
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `AG-${year}/`;

    const lastRecord = await this.prisma.warehouseOwnedContainer.findFirst({
      where: {
        warehouseId,
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: "desc",
      },
      select: { code: true }
    });

    let nextSequence = 1;
    if (lastRecord) {
      const parts = lastRecord.code.split("/");
      if (parts.length === 2) {
        const lastSeq = parseInt(parts[1], 10);
        if (!isNaN(lastSeq)) {
          nextSequence = lastSeq + 1;
        }
      }
    }

    return {
      code: `${prefix}${nextSequence.toString().padStart(4, "0")}`,
    };
  }

  async create(dto: CreateContainerProprioDto, performedByUserId?: string) {
    const warehouseId = await this.context.getWarehouseId();
    
    let code = dto.code?.trim().toUpperCase();
    if (!code) {
      const next = await this.generateNextCode();
      code = next.code;
    }

    const existing = await this.prisma.warehouseOwnedContainer.findFirst({
      where: { warehouseId, code },
    });

    if (existing) {
      throw new ConflictException(`Já existe um container com o código ${code} neste armazém.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.warehouseOwnedContainer.create({
        data: {
          warehouseId,
          code,
          containerNumber: dto.containerNumber?.trim().toUpperCase() || null,
          containerType: dto.containerType?.trim().toUpperCase() || null,
          isFull: dto.isFull ?? false,
          supplierId: dto.supplierId || null,
          location: dto.location?.trim().toUpperCase() || null,
          status: dto.status || WarehouseOwnedContainerStatus.AVAILABLE,
          observations: dto.observations?.trim() || null,
        },
        include: {
          supplier: true,
          holderCustomer: { select: { id: true, name: true, document: true } },
        }
      });

      // Handle Damages (Avarias)
      if (dto.avarias && dto.avarias.length > 0) {
        await tx.warehouseDamage.createMany({
          data: dto.avarias.map((avaria) => ({
            warehouseId,
            ownedContainerId: created.id,
            severity: DamageSeverity.MEDIUM,
            status: DamageStatus.OPEN,
            description: avaria,
            photoObjectKeys: [],
          })),
        });
      }

      await this.audit.log({
        entityType: "WarehouseOwnedContainer",
        entityId: created.id,
        action: AuditAction.CREATE,
        after: created as any,
        performedByUserId,
      });

      return created;
    });
  }

  async findAll(params: FindAllParams) {
    const warehouseId = await this.context.getWarehouseId();
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { warehouseId };

    if (params.search) {
      const s = params.search.trim().toUpperCase();
      where.OR = [
        { code: { contains: s, mode: "insensitive" } },
        { containerNumber: { contains: s, mode: "insensitive" } },
        { supplier: { name: { contains: s, mode: "insensitive" } } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.inPatio === true) {
      where.status = {
        not: WarehouseOwnedContainerStatus.WITH_CUSTOMER,
      };
    }

    if (params.customerIds && params.customerIds.length > 0) {
      where.holderCustomerId = { in: params.customerIds };
    }

    const [data, total] = await Promise.all([
      this.prisma.warehouseOwnedContainer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
           supplier: true,
           holderCustomer: { select: { id: true, name: true, document: true } },
           damages: {
             where: { status: DamageStatus.OPEN }
           }
        }
      }),
      this.prisma.warehouseOwnedContainer.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const warehouseId = await this.context.getWarehouseId();
    const container = await this.prisma.warehouseOwnedContainer.findUnique({
      where: { id },
      include: {
        supplier: true,
        holderCustomer: { select: { id: true, name: true, document: true } },
        damages: {
          where: { status: DamageStatus.OPEN }
        }
      }
    });

    if (!container || container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container próprio não encontrado.");
    }

    return container;
  }

  async dispatch(
    id: string,
    dto: DispatchOwnedContainerDto,
    performedByUserId?: string,
  ) {
    const warehouseId = await this.context.getWarehouseId();
    const container = await this.findOne(id);

    if (container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container próprio não encontrado.");
    }

    if (container.status === WarehouseOwnedContainerStatus.WITH_CUSTOMER) {
      throw new ConflictException("Container já está marcado como WITH_CUSTOMER.");
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException("Cliente (customerId) não encontrado.");
    }

    return this.prisma.$transaction(async (tx) => {
      // Create Damages (Avarias)
      if (dto.avarias && dto.avarias.length > 0) {
        await tx.warehouseDamage.createMany({
          data: dto.avarias.map((avaria) => ({
            warehouseId,
            ownedContainerId: id,
            severity: DamageSeverity.MEDIUM,
            status: DamageStatus.OPEN,
            description: avaria,
            photoObjectKeys: [],
          })),
        });
      }

      const updated = await tx.warehouseOwnedContainer.update({
        where: { id },
        data: {
          status: WarehouseOwnedContainerStatus.WITH_CUSTOMER,
          holderCustomerId: dto.customerId,
        },
        include: {
          supplier: true,
          holderCustomer: { select: { id: true, name: true, document: true } },
          damages: { where: { status: DamageStatus.OPEN } },
        },
      });

      await this.audit.log({
        entityType: "WarehouseOwnedContainer",
        entityId: updated.id,
        action: AuditAction.STATUS_CHANGE,
        before: { status: container.status, holderCustomerId: container.holderCustomerId },
        after: {
          status: updated.status,
          holderCustomerId: updated.holderCustomerId,
          notes: dto.notes ?? null,
          carrierId: dto.carrierId ?? null,
          driverId: dto.driverId ?? null,
          vehicleId: dto.vehicleId ?? null,
        },
        performedByUserId,
      });

      return updated;
    });
  }

  async returnToPatio(
    id: string,
    dto: ReturnOwnedContainerDto,
    performedByUserId?: string,
  ) {
    const warehouseId = await this.context.getWarehouseId();
    const container = await this.findOne(id);

    if (container.warehouseId !== warehouseId) {
      throw new NotFoundException("Container próprio não encontrado.");
    }

    if (container.status !== WarehouseOwnedContainerStatus.WITH_CUSTOMER) {
      throw new ConflictException("Somente é possível devolver quando status for WITH_CUSTOMER.");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.warehouseOwnedContainer.update({
        where: { id },
        data: {
          status: WarehouseOwnedContainerStatus.AVAILABLE,
          holderCustomerId: null,
          location: dto.location ? dto.location.trim().toUpperCase() : undefined,
        },
        include: {
          supplier: true,
          holderCustomer: { select: { id: true, name: true, document: true } },
          damages: { where: { status: DamageStatus.OPEN } },
        },
      });

      await this.audit.log({
        entityType: "WarehouseOwnedContainer",
        entityId: updated.id,
        action: AuditAction.STATUS_CHANGE,
        before: {
          status: container.status,
          holderCustomerId: container.holderCustomerId,
          location: container.location,
        },
        after: {
          status: updated.status,
          holderCustomerId: updated.holderCustomerId,
          location: updated.location,
          notes: dto.notes ?? null,
        },
        performedByUserId,
      });

      return updated;
    });
  }

  async update(id: string, dto: UpdateContainerProprioDto, performedByUserId?: string) {
    const warehouseId = await this.context.getWarehouseId();
    const container = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.warehouseOwnedContainer.update({
        where: { id },
        data: {
          code: dto.code?.trim().toUpperCase(),
          containerNumber: dto.containerNumber?.trim().toUpperCase(),
          containerType: dto.containerType?.trim().toUpperCase(),
          isFull: dto.isFull,
          supplierId: dto.supplierId,
          location: dto.location?.trim().toUpperCase(),
          status: dto.status,
          observations: dto.observations?.trim(),
        },
        include: {
          supplier: true,
          holderCustomer: { select: { id: true, name: true, document: true } },
        }
      });

      // Sync Damages (Avarias)
      if (dto.avarias !== undefined) {
        await tx.warehouseDamage.deleteMany({
          where: { ownedContainerId: id },
        });

        if (dto.avarias.length > 0) {
          await tx.warehouseDamage.createMany({
            data: dto.avarias.map((avaria) => ({
              warehouseId,
              ownedContainerId: id,
              severity: DamageSeverity.MEDIUM,
              status: DamageStatus.OPEN,
              description: avaria,
              photoObjectKeys: [],
            })),
          });
        }
      }

      await this.audit.log({
        entityType: "WarehouseOwnedContainer",
        entityId: updated.id,
        action: container.status !== updated.status ? AuditAction.STATUS_CHANGE : AuditAction.UPDATE,
        before: container as any,
        after: updated as any,
        performedByUserId,
      });

      return updated;
    });
  }

  async remove(id: string, performedByUserId?: string) {
    const container = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.warehouseDamage.deleteMany({
        where: { ownedContainerId: id }
      });

      const deleted = await tx.warehouseOwnedContainer.delete({
        where: { id },
      });

      await this.audit.log({
        entityType: "WarehouseOwnedContainer",
        entityId: id,
        action: AuditAction.DELETE,
        before: container as any,
        performedByUserId,
      });

      return deleted;
    });
  }
}
