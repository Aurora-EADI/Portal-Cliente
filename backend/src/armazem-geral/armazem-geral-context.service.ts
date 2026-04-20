import { Injectable } from "@nestjs/common";
import { WarehouseModality } from "@prisma/client";
import { PrismaPostgresService } from "../prisma/prisma.service";

const WAREHOUSE_GENERAL_CODE = "ARMAZEM_GERAL";

@Injectable()
export class ArmazemGeralContextService {
  private cachedWarehouseId: string | null = null;

  constructor(private readonly prisma: PrismaPostgresService) {}

  async getWarehouseId(): Promise<string> {
    if (this.cachedWarehouseId) return this.cachedWarehouseId;

    const warehouse = await this.prisma.warehouse.upsert({
      where: { code: WAREHOUSE_GENERAL_CODE },
      create: {
        code: WAREHOUSE_GENERAL_CODE,
        name: "Armazem Geral",
        modality: WarehouseModality.GENERAL,
        active: true,
      },
      update: {
        modality: WarehouseModality.GENERAL,
        active: true,
      },
      select: { id: true },
    });

    this.cachedWarehouseId = warehouse.id;
    return warehouse.id;
  }
}
