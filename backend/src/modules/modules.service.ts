import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaPostgresService as  PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.module.findMany({
      orderBy: { name: 'asc' },
      include: {
        activities: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async create(createModuleDto: CreateModuleDto) {
    return this.prisma.module.create({
      data: {
        name: createModuleDto.name,
        description: createModuleDto.description,
        route: createModuleDto.route,
        icon: createModuleDto.icon,
      },
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.module.delete({
        where: { id: Number(id) },
      });
    } catch (error) {
      throw new NotFoundException(`Módulo com ID ${id} não encontrado`);
    }
  }
}