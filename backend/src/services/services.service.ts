import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServiceModal } from "@prisma/client-postgres";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async create(createServiceDto: CreateServiceDto, userId: string) {
    const existingService = await this.prisma.service.findUnique({
      where: { code: createServiceDto.code },
    });

    if (existingService) {
      throw new ConflictException(
        `Serviço com código ${createServiceDto.code} já existe`,
      );
    }

    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAll(includeInactive = false, modal?: ServiceModal) {
    const where: any = includeInactive ? {} : { isActive: true };
    
    // Filtro por modal
    if (modal) {
      where.modal = {
        in: [modal, ServiceModal.BOTH], // Inclui serviços específicos + BOTH
      };
    }

    return this.prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  // 👇 NOVO MÉTODO: Buscar serviços aéreos
  async findAirServices(includeInactive = false) {
    return this.findAll(includeInactive, ServiceModal.AIR);
  }

  // 👇 NOVO MÉTODO: Buscar serviços marítimos
  async findMaritimeServices(includeInactive = false) {
    return this.findAll(includeInactive, ServiceModal.MARITIME);
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        serviceCosts: {
          orderBy: { validFrom: "desc" },
          take: 5,
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Serviço com ID ${id} não encontrado`);
    }

    return service;
  }

  async getCurrentCost(id: string) {
    const service = await this.findOne(id);

    const currentCost = await this.prisma.serviceCost.findFirst({
      where: {
        serviceId: id,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      orderBy: { validFrom: "desc" },
    });

    return {
      service: {
        id: service.id,
        code: service.code,
        name: service.name,
        modal: service.modal,
      },
      currentCost: currentCost || null,
    };
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.findOne(id);

    if (updateServiceDto.code) {
      const existingService = await this.prisma.service.findUnique({
        where: { code: updateServiceDto.code },
      });

      if (existingService && existingService.id !== id) {
        throw new ConflictException(
          `Serviço com código ${updateServiceDto.code} já existe`,
        );
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        serviceCosts: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Serviço com ID ${id} não encontrado`);
    }

    if (service.serviceCosts.length > 0) {
      throw new BadRequestException(
        `Não é possível deletar serviço com ${service.serviceCosts.length} registro(s) de custo no histórico. ` +
          `Este histórico é importante para auditoria. Use o método remove() para desativar o serviço.`,
      );
    }

    return this.prisma.service.delete({
      where: { id },
    });
  }
}