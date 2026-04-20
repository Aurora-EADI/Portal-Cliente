import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { ArmazemGeralContextService } from "../armazem-geral-context.service";
import { ArmazemGeralAuditService } from "../armazem-geral-audit.service";
import { CreateConferenteDto } from "./dto/create-conferente.dto";
import { UpdateConferenteDto } from "./dto/update-conferente.dto";
import { AuditAction, Prisma } from "@prisma/client";

@Injectable()
export class ConferentesService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
    private readonly audit: ArmazemGeralAuditService,
  ) {}

  async create(dto: CreateConferenteDto) {
    const warehouseId = await this.context.getWarehouseId();

    try {
      const conferente = await this.prisma.conferente.create({
        data: {
          ...dto,
          warehouseId,
        },
      });

      await this.audit.log({
        entityType: "Conferente",
        entityId: conferente.id,
        action: AuditAction.CREATE,
        after: conferente as unknown as Prisma.InputJsonValue,
      });

      return conferente;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "Matrícula ou CPF já cadastrado para este armazém.",
        );
      }
      throw error;
    }
  }

  async findAll(
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const warehouseId = await this.context.getWarehouseId();
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ConferenteWhereInput = { warehouseId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { matricula: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.conferente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.conferente.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const warehouseId = await this.context.getWarehouseId();
    const conferente = await this.prisma.conferente.findUnique({
      where: { id },
    });

    if (!conferente || conferente.warehouseId !== warehouseId) {
      throw new NotFoundException("Conferente não encontrado.");
    }

    return conferente;
  }

  async update(id: string, dto: UpdateConferenteDto) {
    const warehouseId = await this.context.getWarehouseId();
    const existing = await this.findOne(id);

    try {
      const updated = await this.prisma.conferente.update({
        where: { id },
        data: dto,
      });

      await this.audit.log({
        entityType: "Conferente",
        entityId: updated.id,
        action: AuditAction.UPDATE,
        before: existing as unknown as Prisma.InputJsonValue,
        after: updated as unknown as Prisma.InputJsonValue,
      });

      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "Matrícula ou CPF já cadastrado para este armazém.",
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const warehouseId = await this.context.getWarehouseId();
    const existing = await this.findOne(id);

    await this.prisma.conferente.delete({
      where: { id },
    });

    await this.audit.log({
      entityType: "Conferente",
      entityId: existing.id,
      action: AuditAction.DELETE,
      before: existing as unknown as Prisma.InputJsonValue,
    });

    return { message: "Conferente removido com sucesso." };
  }
}
