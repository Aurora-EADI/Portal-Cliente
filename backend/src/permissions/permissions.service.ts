import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todas as permissões técnicas
   * @param category - Filtro opcional por categoria
   */
  async findAll(category?: string) {
    const where = category ? { category } : {};

    const permissions = await this.prisma.permission.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
      include: {
        activities: {
          select: {
            activity: {
              select: {
                id: true,
                name: true,
                moduleId: true,
              },
            },
          },
        },
      },
    });

    // Formata a resposta para incluir contagem de atividades vinculadas
    return permissions.map((permission) => ({
      id: permission.id,
      key: permission.key,
      description: permission.description,
      category: permission.category,
      activitiesCount: permission.activities.length,
      linkedActivities: permission.activities.map((ap) => ({
        id: ap.activity.id,
        name: ap.activity.name,
        moduleId: ap.activity.moduleId,
      })),
    }));
  }

  /**
   * Busca uma permissão específica por ID
   */
  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        activities: {
          include: {
            activity: {
              include: {
                module: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permissão com ID ${id} não encontrada`);
    }

    return {
      id: permission.id,
      key: permission.key,
      description: permission.description,
      category: permission.category,
      linkedActivities: permission.activities.map((ap) => ({
        id: ap.activity.id,
        name: ap.activity.name,
        module: ap.activity.module.name,
      })),
    };
  }

  /**
   * Busca uma permissão por chave (key)
   */
  async findByKey(key: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { key },
    });

    if (!permission) {
      throw new NotFoundException(`Permissão com chave "${key}" não encontrada`);
    }

    return permission;
  }

  /**
   * Cria uma nova permissão técnica
   */
  async create(createPermissionDto: CreatePermissionDto) {
    const { key, description, category } = createPermissionDto;

    // Verifica se a chave já existe
    const existingPermission = await this.prisma.permission.findUnique({
      where: { key },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Já existe uma permissão com a chave "${key}"`,
      );
    }

    const permission = await this.prisma.permission.create({
      data: {
        key,
        description: description || null,
        category: category || null,
      },
    });

    return {
      message: 'Permissão criada com sucesso',
      permission,
    };
  }

  /**
   * Atualiza uma permissão existente
   */
  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    // Verifica se a permissão existe
    await this.findOne(id);

    const { key, description, category } = updatePermissionDto;

    // Se está tentando alterar a chave, verifica se já existe
    if (key) {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { key },
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException(
          `Já existe uma permissão com a chave "${key}"`,
        );
      }
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: {
        key: key || undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
      },
    });

    return {
      message: 'Permissão atualizada com sucesso',
      permission: updatedPermission,
    };
  }

  /**
   * Remove uma permissão
   * IMPORTANTE: Só permite deletar se não houver atividades vinculadas
   */
  async remove(id: number) {
    // Verifica se a permissão existe
    const permission = await this.findOne(id);

    // Verifica se há atividades vinculadas
    const linkedActivities = await this.prisma.activityPermission.count({
      where: { permissionId: id },
    });

    if (linkedActivities > 0) {
      throw new BadRequestException(
        `Não é possível deletar esta permissão pois existem ${linkedActivities} atividade(s) vinculada(s). ` +
        `Remova os vínculos antes de deletar.`,
      );
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return {
      message: 'Permissão deletada com sucesso',
    };
  }

  /**
   * Lista todas as categorias únicas
   * Útil para filtros no frontend
   */
  async getCategories() {
    const permissions = await this.prisma.permission.findMany({
      where: {
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return permissions
      .map((p) => p.category)
      .filter((c) => c !== null)
      .sort();
  }

  /**
   * Busca permissões que não estão vinculadas a nenhuma atividade
   * Útil para identificar permissões órfãs
   */
  async findOrphaned() {
    const allPermissions = await this.prisma.permission.findMany({
      include: {
        activities: true,
      },
    });

    const orphaned = allPermissions.filter((p) => p.activities.length === 0);

    return {
      count: orphaned.length,
      permissions: orphaned.map((p) => ({
        id: p.id,
        key: p.key,
        description: p.description,
        category: p.category,
      })),
    };
  }
}