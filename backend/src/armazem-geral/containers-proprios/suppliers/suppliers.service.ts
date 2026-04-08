import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaPostgresService } from "../../../prisma/prisma.service";
import { ArmazemGeralContextService } from "../../armazem-geral-context.service";
import { CreateContainerAgSupplierDto } from "./dto/create-supplier.dto";
import { UpdateContainerAgSupplierDto } from "./dto/update-supplier.dto";

@Injectable()
export class ContainersAgSuppliersService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
  ) {}

  async create(dto: CreateContainerAgSupplierDto) {
    const warehouseId = await this.context.getWarehouseId();
    return this.prisma.warehouseOwnedContainerSupplier.create({
      data: {
        ...dto,
        warehouseId,
      },
    });
  }

  async findAll() {
    const warehouseId = await this.context.getWarehouseId();
    return this.prisma.warehouseOwnedContainerSupplier.findMany({
      where: { warehouseId },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const warehouseId = await this.context.getWarehouseId();
    const supplier = await this.prisma.warehouseOwnedContainerSupplier.findUnique({
      where: { id },
    });

    if (!supplier || supplier.warehouseId !== warehouseId) {
      throw new NotFoundException("Fornecedor não encontrado.");
    }

    return supplier;
  }

  async update(id: string, dto: UpdateContainerAgSupplierDto) {
    await this.findOne(id);
    return this.prisma.warehouseOwnedContainerSupplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.warehouseOwnedContainerSupplier.delete({
      where: { id },
    });
  }
}
