import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { CreateServiceCostDto } from "./dto/create-service-cost.dto";

@Injectable()
export class ServiceCostsService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async create(createServiceCostDto: CreateServiceCostDto, userId: string) {
    // Verifica se o serviço existe
    const service = await this.prisma.service.findUnique({
      where: { id: createServiceCostDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(
        `Serviço com ID ${createServiceCostDto.serviceId} não encontrado`,
      );
    }

    // Se não informar validFrom, usa data atual
    const validFrom = createServiceCostDto.validFrom
      ? new Date(createServiceCostDto.validFrom)
      : new Date();

    // Marca o custo anterior como expirado (validUntil = validFrom do novo)
    await this.prisma.serviceCost.updateMany({
      where: {
        serviceId: createServiceCostDto.serviceId,
        validUntil: null, // Custos vigentes
      },
      data: {
        validUntil: validFrom,
      },
    });

    // Cria o novo custo
    return this.prisma.serviceCost.create({
      data: {
        serviceId: createServiceCostDto.serviceId,
        cost: createServiceCostDto.cost,
        validFrom,
        validUntil: createServiceCostDto.validUntil
          ? new Date(createServiceCostDto.validUntil)
          : null,
        createdBy: userId,
        reason: createServiceCostDto.reason,
      },
      include: {
        service: {
          select: {
            code: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.serviceCost.findMany({
      include: {
        service: {
          select: {
            code: true,
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByService(serviceId: string) {
    // Verifica se o serviço existe
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Serviço com ID ${serviceId} não encontrado`);
    }

    return this.prisma.serviceCost.findMany({
      where: { serviceId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { validFrom: "desc" },
    });
  }

  async getCurrentCost(serviceId: string) {
    const cost = await this.prisma.serviceCost.findFirst({
      where: {
        serviceId,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      include: {
        service: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { validFrom: "desc" },
    });

    if (!cost) {
      throw new NotFoundException(
        `Nenhum custo vigente encontrado para o serviço ${serviceId}`,
      );
    }

    return cost;
  }

  async getCostAtDate(serviceId: string, date: Date) {
    const cost = await this.prisma.serviceCost.findFirst({
      where: {
        serviceId,
        validFrom: { lte: date },
        OR: [{ validUntil: null }, { validUntil: { gte: date } }],
      },
      include: {
        service: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { validFrom: "desc" },
    });

    if (!cost) {
      throw new NotFoundException(
        `Nenhum custo encontrado para o serviço ${serviceId} na data ${date.toISOString()}`,
      );
    }

    return cost;
  }

  async findOne(id: string) {
    const cost = await this.prisma.serviceCost.findUnique({
      where: { id },
      include: {
        service: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!cost) {
      throw new NotFoundException(`Custo com ID ${id} não encontrado`);
    }

    return cost;
  }
}
