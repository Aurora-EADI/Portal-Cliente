import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { CreateCarrierDto } from "./dto/create-carrier.dto";
import { UpdateCarrierDto } from "./dto/update-carrier.dto";
import { UpsertCarrierDriverDto } from "./dto/upsert-carrier-driver.dto";
import { UpsertCarrierVehicleDto } from "./dto/upsert-carrier-vehicle.dto";

interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

@Injectable()
export class CarriersService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async create(dto: CreateCarrierDto) {
    // Remove apenas pontuação do CNPJ, preservando letras (alfanumérico - RFB 2026)
    const cnpj = dto.cnpj
      ? dto.cnpj.replace(/[.\-\/]/g, "").toUpperCase()
      : undefined;

    if (cnpj) {
      const existing = await this.prisma.carrier.findUnique({
        where: { cnpj },
      });
      if (existing) {
        throw new ConflictException("Já existe transportadora com este CNPJ.");
      }
    }

    return this.prisma.carrier.create({
      data: {
        name: dto.name,
        cnpj: cnpj,
        active: dto.active ?? true,
        drivers: dto.drivers?.length
          ? {
              create: dto.drivers.map((d) => ({
                name: d.name,
                cpf: d.cpf ? d.cpf.replace(/\D/g, "") : null,
                phone: d.phone ?? null,
              })),
            }
          : undefined,
        vehicles: dto.vehicles?.length
          ? {
              create: dto.vehicles.map((v) => ({
                plate: v.plate.toUpperCase(),
                type: v.type ?? null,
              })),
            }
          : undefined,
      },
      include: { drivers: true, vehicles: true },
    });
  }

  async findAll(params: FindAllParams = {}) {
    const { page = 1, limit = 20, search, active } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        {
          cnpj: {
            contains: search.replace(/[.\-\/]/g, ""),
            mode: "insensitive",
          },
        },
      ];
    }
    if (active !== undefined) {
      where.active = active;
    }

    const [data, total] = await Promise.all([
      this.prisma.carrier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          drivers: { orderBy: { name: "asc" } },
          vehicles: { orderBy: { plate: "asc" } },
        },
      }),
      this.prisma.carrier.count({ where }),
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
    const carrier = await this.prisma.carrier.findUnique({
      where: { id },
      include: {
        drivers: { orderBy: { name: "asc" } },
        vehicles: { orderBy: { plate: "asc" } },
      },
    });

    if (!carrier) {
      throw new NotFoundException("Transportadora não encontrada.");
    }

    return carrier;
  }

  async update(id: string, dto: UpdateCarrierDto) {
    const existing = await this.prisma.carrier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Transportadora não encontrada.");
    }

    // Remove apenas pontuação do CNPJ, preservando letras (alfanumérico - RFB 2026)
    const cnpj = dto.cnpj
      ? dto.cnpj.replace(/[.\-\/]/g, "").toUpperCase()
      : undefined;

    if (cnpj && cnpj !== existing.cnpj) {
      const dup = await this.prisma.carrier.findUnique({ where: { cnpj } });
      if (dup) {
        throw new ConflictException("Já existe transportadora com este CNPJ.");
      }
    }

    return this.prisma.carrier.update({
      where: { id },
      data: {
        name: dto.name,
        cnpj: cnpj,
        active: dto.active,
      },
      include: { drivers: true, vehicles: true },
    });
  }

  async upsertDrivers(carrierId: string, drivers: UpsertCarrierDriverDto[]) {
    const carrier = await this.prisma.carrier.findUnique({
      where: { id: carrierId },
      select: { id: true },
    });
    if (!carrier) {
      throw new NotFoundException("Transportadora não encontrada.");
    }

    if (!Array.isArray(drivers)) {
      throw new BadRequestException("Body deve ser um array de motoristas.");
    }

    await this.prisma.$transaction(async (tx) => {
      for (const driver of drivers) {
        const cpf = driver.cpf ? driver.cpf.replace(/\D/g, "") : null;
        if (driver.id) {
          await tx.carrierDriver.update({
            where: { id: driver.id },
            data: {
              name: driver.name,
              cpf,
              phone: driver.phone ?? null,
              active: driver.active ?? true,
            },
          });
        } else {
          await tx.carrierDriver.create({
            data: {
              carrierId,
              name: driver.name,
              cpf,
              phone: driver.phone ?? null,
              active: driver.active ?? true,
            },
          });
        }
      }
    });

    return this.findOne(carrierId);
  }

  async upsertVehicles(carrierId: string, vehicles: UpsertCarrierVehicleDto[]) {
    const carrier = await this.prisma.carrier.findUnique({
      where: { id: carrierId },
      select: { id: true },
    });
    if (!carrier) {
      throw new NotFoundException("Transportadora não encontrada.");
    }

    if (!Array.isArray(vehicles)) {
      throw new BadRequestException("Body deve ser um array de veículos.");
    }

    await this.prisma.$transaction(async (tx) => {
      for (const vehicle of vehicles) {
        const plate = vehicle.plate.toUpperCase();
        if (vehicle.id) {
          await tx.carrierVehicle.update({
            where: { id: vehicle.id },
            data: {
              plate,
              type: vehicle.type ?? null,
              active: vehicle.active ?? true,
            },
          });
        } else {
          await tx.carrierVehicle.create({
            data: {
              carrierId,
              plate,
              type: vehicle.type ?? null,
              active: vehicle.active ?? true,
            },
          });
        }
      }
    });

    return this.findOne(carrierId);
  }

  async remove(id: string) {
    const carrier = await this.prisma.carrier.findUnique({ where: { id } });
    if (!carrier) {
      throw new NotFoundException("Transportadora não encontrada.");
    }

    try {
      await this.prisma.carrier.delete({ where: { id } });
    } catch (error: any) {
      throw new BadRequestException(
        "Não foi possível remover a transportadora (verifique vínculos).",
      );
    }
  }
}
