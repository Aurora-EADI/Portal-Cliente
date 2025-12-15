import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaPostgresService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async create(createServiceDto: CreateServiceDto, userId: string) {
    // Verifica se o código já existe
    const existingService = await this.prisma.service.findUnique({
      where: { code: createServiceDto.code },
    });

    if (existingService) {
      throw new ConflictException(`Serviço com código ${createServiceDto.code} já existe`);
    }

    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.service.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        serviceCosts: {
          orderBy: { validFrom: 'desc' },
          take: 5, // Últimos 5 custos
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

    // Busca o custo vigente (validUntil = null OU validUntil > agora)
    const currentCost = await this.prisma.serviceCost.findFirst({
      where: {
        serviceId: id,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      orderBy: { validFrom: 'desc' },
    });

    return {
      service: {
        id: service.id,
        code: service.code,
        name: service.name,
      },
      currentCost: currentCost || null,
    };
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.findOne(id); // Verifica se existe

    // Se estiver alterando o código, verifica duplicidade
    if (updateServiceDto.code) {
      const existingService = await this.prisma.service.findUnique({
        where: { code: updateServiceDto.code },
      });

      if (existingService && existingService.id !== id) {
        throw new ConflictException(`Serviço com código ${updateServiceDto.code} já existe`);
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    // Soft delete: apenas marca como inativo
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    await this.findOne(id); // Verifica se existe

    // Delete permanente (só permitir se não tiver custos ou simulações vinculadas)
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
