import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { ArmazemGeralContextService } from "../armazem-geral-context.service";
import { WarehouseGeneralAuditQueryDto } from "./warehouse-general-audit.query.dto";

@Injectable()
export class WarehouseGeneralAuditQueryService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
  ) {}

  async findAll(query: WarehouseGeneralAuditQueryDto) {
    const warehouseId = await this.context.getWarehouseId();
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 30;
    const skip = (page - 1) * limit;

    const where: Prisma.WarehouseAuditLogWhereInput = {
      warehouseId,
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.performedByUserId
        ? { performedByUserId: query.performedByUserId }
        : {}),
    };

    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.warehouseAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          performedByUser: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.warehouseAuditLog.count({ where }),
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
}
