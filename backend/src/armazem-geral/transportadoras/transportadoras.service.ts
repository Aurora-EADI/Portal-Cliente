import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { CreateTransportadoraDto } from "./dto/create-transportadora.dto";
import { UpdateTransportadoraDto } from "./dto/update-transportadora.dto";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class TransportadorasService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  // ─── TRANSPORTADORA (Carrier) ──────────────────────────────────────────────

  async findAll(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      active?: boolean;
    } = {},
  ) {
    const { page = 1, limit = 10, search, active = true } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CarrierWhereInput = { active };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cnpj: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.carrier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { drivers: true, vehicles: true } },
        },
      }),
      this.prisma.carrier.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const carrier = await this.prisma.carrier.findUnique({
      where: { id },
      include: {
        _count: { select: { drivers: true, vehicles: true } },
      },
    });
    if (!carrier) throw new NotFoundException("Transportadora não encontrada.");
    return carrier;
  }

  async create(dto: CreateTransportadoraDto) {
    try {
      return await this.prisma.carrier.create({ data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "CNPJ já cadastrado para outra transportadora.",
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateTransportadoraDto) {
    await this.findOne(id);
    try {
      return await this.prisma.carrier.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "CNPJ já cadastrado para outra transportadora.",
        );
      }
      throw error;
    }
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.carrier.update({
      where: { id },
      data: { active: false },
    });
  }

  async reactivate(id: string) {
    const carrier = await this.prisma.carrier.findUnique({ where: { id } });
    if (!carrier) throw new NotFoundException("Transportadora não encontrada.");
    return this.prisma.carrier.update({
      where: { id },
      data: { active: true },
    });
  }

  // ─── MOTORISTAS (CarrierDriver) ────────────────────────────────────────────

  async findAllDrivers(
    carrierId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    await this.findOne(carrierId);
    const { page = 1, limit = 50, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CarrierDriverWhereInput = { carrierId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.carrierDriver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.carrierDriver.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async createDriver(carrierId: string, dto: CreateDriverDto) {
    await this.findOne(carrierId);
    return this.prisma.carrierDriver.create({
      data: { ...dto, carrierId },
    });
  }

  async updateDriver(
    carrierId: string,
    driverId: string,
    dto: UpdateDriverDto,
  ) {
    const driver = await this.prisma.carrierDriver.findUnique({
      where: { id: driverId },
    });
    if (!driver || driver.carrierId !== carrierId) {
      throw new NotFoundException("Motorista não encontrado.");
    }
    return this.prisma.carrierDriver.update({
      where: { id: driverId },
      data: dto,
    });
  }

  async toggleDriverActive(carrierId: string, driverId: string) {
    const driver = await this.prisma.carrierDriver.findUnique({
      where: { id: driverId },
    });
    if (!driver || driver.carrierId !== carrierId) {
      throw new NotFoundException("Motorista não encontrado.");
    }
    return this.prisma.carrierDriver.update({
      where: { id: driverId },
      data: { active: !driver.active },
    });
  }

  async removeDriver(carrierId: string, driverId: string) {
    const driver = await this.prisma.carrierDriver.findUnique({
      where: { id: driverId },
    });
    if (!driver || driver.carrierId !== carrierId) {
      throw new NotFoundException("Motorista não encontrado.");
    }
    await this.prisma.carrierDriver.delete({ where: { id: driverId } });
    return { message: "Motorista removido com sucesso." };
  }

  // ─── VEÍCULOS (CarrierVehicle) ─────────────────────────────────────────────

  async findAllVehicles(
    carrierId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    await this.findOne(carrierId);
    const { page = 1, limit = 50, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CarrierVehicleWhereInput = { carrierId };
    if (search) {
      where.OR = [
        { plate: { contains: search, mode: "insensitive" } },
        { type: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.carrierVehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { plate: "asc" },
      }),
      this.prisma.carrierVehicle.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async createVehicle(carrierId: string, dto: CreateVehicleDto) {
    await this.findOne(carrierId);
    try {
      return await this.prisma.carrierVehicle.create({
        data: { ...dto, carrierId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Placa já cadastrada no sistema.");
      }
      throw error;
    }
  }

  async updateVehicle(
    carrierId: string,
    vehicleId: string,
    dto: UpdateVehicleDto,
  ) {
    const vehicle = await this.prisma.carrierVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.carrierId !== carrierId) {
      throw new NotFoundException("Veículo não encontrado.");
    }
    try {
      return await this.prisma.carrierVehicle.update({
        where: { id: vehicleId },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Placa já cadastrada no sistema.");
      }
      throw error;
    }
  }

  async toggleVehicleActive(carrierId: string, vehicleId: string) {
    const vehicle = await this.prisma.carrierVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.carrierId !== carrierId) {
      throw new NotFoundException("Veículo não encontrado.");
    }
    return this.prisma.carrierVehicle.update({
      where: { id: vehicleId },
      data: { active: !vehicle.active },
    });
  }

  async removeVehicle(carrierId: string, vehicleId: string) {
    const vehicle = await this.prisma.carrierVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.carrierId !== carrierId) {
      throw new NotFoundException("Veículo não encontrado.");
    }
    await this.prisma.carrierVehicle.delete({ where: { id: vehicleId } });
    return { message: "Veículo removido com sucesso." };
  }
}
