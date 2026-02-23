import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServiceModal } from "@prisma/client";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async create(createServiceDto: CreateServiceDto, userId: string) {
    const existingService = await this.prisma.service.findUnique({
      where: { code: createServiceDto.code },
    });

    if (existingService) {
      throw new ConflictException(
        `ServiÃ§o com cÃ³digo ${createServiceDto.code} jÃ¡ existe`,
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
        in: [modal, ServiceModal.BOTH], // Inclui serviÃ§os especÃ­ficos + BOTH
      };
    }

    return this.prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  // ðŸ‘‡ NOVO MÃ‰TODO: Buscar serviÃ§os aÃ©reos
  async findAirServices(includeInactive = false) {
    return this.findAll(includeInactive, ServiceModal.AIR);
  }

  // ðŸ‘‡ NOVO MÃ‰TODO: Buscar serviÃ§os marÃ­timos
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
      throw new NotFoundException(`ServiÃ§o com ID ${id} nÃ£o encontrado`);
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
          `ServiÃ§o com cÃ³digo ${updateServiceDto.code} jÃ¡ existe`,
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
      throw new NotFoundException(`ServiÃ§o com ID ${id} nÃ£o encontrado`);
    }

    if (service.serviceCosts.length > 0) {
      throw new BadRequestException(
        `NÃ£o Ã© possÃ­vel deletar serviÃ§o com ${service.serviceCosts.length} registro(s) de custo no histÃ³rico. ` +
          `Este histÃ³rico Ã© importante para auditoria. Use o mÃ©todo remove() para desativar o serviÃ§o.`,
      );
    }

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
