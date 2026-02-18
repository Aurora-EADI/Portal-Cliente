import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { CreateModuleDto } from "./dto/create-module.dto";
import { UpdateModuleDto } from "./dto/update-module.dto";

const MODULE_INCLUDE = {
  activities: {
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  },
  sharedItems: {
    orderBy: { sortOrder: "asc" as const },
  },
  _count: {
    select: {
      userAccess: true,
    },
  },
};

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.module.findMany({
      orderBy: { name: "asc" },
      include: MODULE_INCLUDE,
    });
  }

  async create(createModuleDto: CreateModuleDto) {
    return this.prisma.module.create({
      data: {
        name: createModuleDto.name,
        description: createModuleDto.description,
        route: createModuleDto.route,
        icon: createModuleDto.icon,
        sharedItems: createModuleDto.subPages?.length
          ? {
              create: createModuleDto.subPages.map((sp, index) => ({
                targetRoute: sp.targetRoute,
                label: sp.label,
                icon: sp.icon || null,
                sortOrder: sp.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: MODULE_INCLUDE,
    });
  }

  async findOne(id: number) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: MODULE_INCLUDE,
    });

    if (!module) {
      throw new NotFoundException(`Módulo com ID ${id} não encontrado`);
    }

    return module;
  }

  async update(id: number, updateModuleDto: UpdateModuleDto) {
    // Verificar se o módulo existe
    const module = await this.prisma.module.findUnique({
      where: { id },
    });

    if (!module) {
      throw new NotFoundException(`Módulo com ID ${id} não encontrado`);
    }

    // Separar subPages do resto dos dados
    const { subPages, ...moduleData } = updateModuleDto;

    // Se subPages foi enviado, substitui todas as sub-páginas
    if (subPages !== undefined) {
      await this.prisma.moduleSharedItem.deleteMany({
        where: { moduleId: id },
      });

      if (subPages.length > 0) {
        await this.prisma.moduleSharedItem.createMany({
          data: subPages.map((sp, index) => ({
            moduleId: id,
            targetRoute: sp.targetRoute,
            label: sp.label,
            icon: sp.icon || null,
            sortOrder: sp.sortOrder ?? index,
          })),
        });
      }
    }

    return this.prisma.module.update({
      where: { id },
      data: moduleData,
      include: MODULE_INCLUDE,
    });
  }

  async remove(id: string) {
    const moduleId = Number(id);

    // Verificar se o módulo existe e carregar dependências
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        activities: true,
        userAccess: true,
      },
    });

    if (!module) {
      throw new NotFoundException(`Módulo com ID ${id} não encontrado`);
    }

    // Verificar se há atividades vinculadas
    if (module.activities.length > 0) {
      throw new BadRequestException(
        `Não é possível deletar módulo com ${module.activities.length} atividade(s) vinculada(s). ` +
          `Remova ou reatribua as atividades antes de deletar o módulo. ` +
          `Ou use o campo 'active' para desativar ao invés de deletar.`,
      );
    }

    // Verificar se há acessos de usuários vinculados
    if (module.userAccess.length > 0) {
      throw new BadRequestException(
        `Não é possível deletar módulo com ${module.userAccess.length} acesso(s) de usuário(s) configurado(s). ` +
          `Use o campo 'active' para desativar ao invés de deletar.`,
      );
    }

    // Se passou por todas as verificações, pode deletar
    await this.prisma.module.delete({
      where: { id: moduleId },
    });
  }
}
