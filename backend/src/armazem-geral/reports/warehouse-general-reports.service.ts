import { Injectable } from "@nestjs/common";
import { OperationalContainerStatus, Prisma } from "@prisma/client";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { ArmazemGeralContextService } from "../armazem-geral-context.service";

@Injectable()
export class WarehouseGeneralReportsService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
  ) {}

  async containers(params: { status?: string; from?: string; to?: string }) {
    const warehouseId = await this.context.getWarehouseId();

    const where: Prisma.OperationalContainerWhereInput = { warehouseId };
    if (params.status) {
      where.status = params.status as OperationalContainerStatus;
    }

    const from = params.from ? new Date(params.from) : null;
    const to = params.to ? new Date(params.to) : null;

    if (from || to) {
      where.updatedAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const containers = await this.prisma.operationalContainer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, document: true } },
        movements: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            carrier: true,
            driver: true,
            vehicle: true,
            performedByUser: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      filters: params,
      total: containers.length,
      data: containers,
    };
  }
}
