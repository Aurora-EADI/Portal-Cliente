import {
  AuditAction,
  DamageSeverity,
  DamageStatus,
  Prisma,
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
import { CreateDamageDto } from "./dto/create-damage.dto";
import { ResolveDamageDto } from "./dto/resolve-damage.dto";

interface FindAllParams {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
}

@Injectable()
export class WarehouseGeneralDamagesService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
    private readonly audit: ArmazemGeralAuditService,
  ) {}

  async create(dto: CreateDamageDto, performedByUserId: string) {
    const warehouseId = await this.context.getWarehouseId();

    if (!dto.containerId && !dto.cargoId) {
      throw new BadRequestException(
        "Informe containerId ou cargoId para registrar a avaria.",
      );
    }

    if (dto.containerId) {
      const container = await this.prisma.operationalContainer.findUnique({
        where: { id: dto.containerId },
        select: { id: true, warehouseId: true },
      });
      if (!container || container.warehouseId !== warehouseId) {
        throw new NotFoundException("Container não encontrado.");
      }
    }

    if (dto.cargoId) {
      const cargo = await this.prisma.warehouseCargo.findUnique({
        where: { id: dto.cargoId },
        select: { id: true, warehouseId: true },
      });
      if (!cargo || cargo.warehouseId !== warehouseId) {
        throw new NotFoundException("Carga não encontrada.");
      }
    }

    const damage = await this.prisma.warehouseDamage.create({
      data: {
        warehouseId,
        containerId: dto.containerId ?? null,
        cargoId: dto.cargoId ?? null,
        severity: dto.severity,
        description: dto.description,
        status: DamageStatus.OPEN,
        photoObjectKeys: dto.photoObjectKeys ?? [],
      },
    });

    await this.audit.log({
      entityType: "WarehouseDamage",
      entityId: damage.id,
      action: AuditAction.CREATE,
      after: damage as unknown as Prisma.InputJsonValue,
      performedByUserId,
    });

    return damage;
  }

  async resolve(id: string, dto: ResolveDamageDto, performedByUserId: string) {
    const warehouseId = await this.context.getWarehouseId();
    const existing = await this.prisma.warehouseDamage.findUnique({
      where: { id },
    });
    if (!existing || existing.warehouseId !== warehouseId) {
      throw new NotFoundException("Avaria não encontrada.");
    }

    if (existing.status === DamageStatus.RESOLVED) {
      throw new ConflictException("Avaria já está resolvida.");
    }

    const updated = await this.prisma.warehouseDamage.update({
      where: { id },
      data: {
        status: DamageStatus.RESOLVED,
        resolvedAt: new Date(),
        description: dto.resolutionNotes
          ? `${existing.description}\n\n[RESOLUCAO] ${dto.resolutionNotes}`
          : existing.description,
      },
    });

    await this.audit.log({
      entityType: "WarehouseDamage",
      entityId: updated.id,
      action: AuditAction.STATUS_CHANGE,
      before: { status: existing.status },
      after: { status: updated.status },
      performedByUserId,
    });

    return updated;
  }

  async findAll(params: FindAllParams = {}) {
    const warehouseId = await this.context.getWarehouseId();
    const { page = 1, limit = 20, status, severity } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WarehouseDamageWhereInput = { warehouseId };
    if (status) where.status = status as any;
    if (severity) where.severity = severity as any;

    const [data, total] = await Promise.all([
      this.prisma.warehouseDamage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          container: { select: { id: true, containerNumber: true } },
          cargo: { select: { id: true, description: true } },
        },
      }),
      this.prisma.warehouseDamage.count({ where }),
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
    const damage = await this.prisma.warehouseDamage.findUnique({
      where: { id },
      include: {
        container: { select: { id: true, containerNumber: true } },
        cargo: { select: { id: true, description: true } },
      },
    });
    if (!damage || damage.warehouseId !== warehouseId) {
      throw new NotFoundException("Avaria não encontrada.");
    }
    return damage;
  }
}
