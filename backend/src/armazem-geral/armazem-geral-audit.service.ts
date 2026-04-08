import { Injectable } from "@nestjs/common";
import { AuditAction, Prisma } from "@prisma/client";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { ArmazemGeralContextService } from "./armazem-geral-context.service";

@Injectable()
export class ArmazemGeralAuditService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
  ) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    performedByUserId?: string | null;
  }) {
    const warehouseId = await this.context.getWarehouseId();

    return this.prisma.warehouseAuditLog.create({
      data: {
        warehouseId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        ...(params.before !== undefined ? { before: params.before } : {}),
        ...(params.after !== undefined ? { after: params.after } : {}),
        performedByUserId: params.performedByUserId ?? null,
      },
    });
  }
}
