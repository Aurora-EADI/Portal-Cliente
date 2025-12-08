// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaPostgresService as  PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client-postgres';
import {
  UserActivityResponse,
  UserPermissionResponse,
  UserPermissionsResult,
} from './types/user-responses.type';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, role, companyId, position } = createUserDto;

    // Validação: SUPPLIER e EMPLOYEE precisam de companyId
    if ((role === UserRole.SUPPLIER || role === UserRole.EMPLOYEE) && !companyId) {
      throw new BadRequestException(
        'companyId é obrigatório para SUPPLIER e EMPLOYEE',
      );
    }

    // Verifica se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Verifica se a empresa existe (se companyId foi fornecido)
    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        companyId: companyId || null,
        position: position || null,
      },
      include: {
        company: {
          select: {
            id: true,
            fantasyName: true,
            cnpj: true,
          },
        },
      },
    });

    // Remove a senha da resposta
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        company: {
          select: {
            id: true,
            fantasyName: true,
            cnpj: true,
            status: true,
          },
        },
        moduleAccess: {
          include: {
            module: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove senhas da resposta
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        moduleAccess: {
          include: {
            module: true,
            activityAccess: {
              include: {
                activity: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Remove a senha da resposta
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verifica se o usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { email, password, role, ...restDto } = updateUserDto;

    // Se estiver alterando o email, verifica se já não está em uso
    if (email && email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email },
      });

      if (emailInUse) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Prepara os dados para atualização
    const dataToUpdate: any = { ...restDto };

    if (email) dataToUpdate.email = email;
    if (role) dataToUpdate.role = role;

    // Se a senha foi fornecida, criptografa
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    // Atualiza o usuário
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        company: {
          select: {
            id: true,
            fantasyName: true,
            cnpj: true,
          },
        },
      },
    });

    // Remove a senha da resposta
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async remove(id: string) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Deleta o usuário (cascade vai remover relacionamentos)
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Usuário deletado com sucesso' };
  }

  async getUserModules(id: string) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Busca os módulos do usuário
    const moduleAccess = await this.prisma.userModuleAccess.findMany({
      where: { userId: id },
      include: {
        module: {
          include: {
            activities: true,
          },
        },
      },
    });

    return moduleAccess;
  }

async getUserActivities(id: string): Promise<UserActivityResponse[]> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const moduleAccess = await this.prisma.userModuleAccess.findMany({
      where: {
        userId: id,
        isEnabled: true,
      },
      include: {
        module: {
          include: {
            activities: true,
          },
        },
        activityAccess: {
          include: {
            activity: true,
          },
        },
      },
    });

    const activities: UserActivityResponse[] = [];

    moduleAccess.forEach((access) => {
      // Atividades obrigatórias
      const mandatoryActivities = access.module.activities
        .filter((act) => act.isMandatory)
        .map((act) => ({
          id: act.id,
          name: act.name,
          moduleId: act.moduleId,
          moduleName: access.module.name,
          isMandatory: true,
          isEnabled: true,
        }));

      // Atividades opcionais
      const optionalActivities = access.activityAccess
        .filter((actAccess) => actAccess.isEnabled)
        .map((actAccess) => ({
          id: actAccess.activity.id,
          name: actAccess.activity.name,
          moduleId: actAccess.activity.moduleId,
          moduleName: access.module.name,
          isMandatory: false,
          isEnabled: true,
        }));

      activities.push(...mandatoryActivities, ...optionalActivities);
    });

    return activities;
  }

  async getUserPermissions(id: string): Promise<UserPermissionsResult> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const moduleAccess = await this.prisma.userModuleAccess.findMany({
      where: {
        userId: id,
        isEnabled: true,
      },
      include: {
        module: {
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
        },
        activityAccess: {
          where: { isEnabled: true },
          include: {
            activity: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const permissionsSet = new Set<string>();
    const permissionsList: UserPermissionResponse[] = [];

    moduleAccess.forEach((access) => {
      // Permissões de atividades obrigatórias
      access.module.activities
        .filter((act) => act.isMandatory)
        .forEach((act) => {
          act.permissions.forEach((ap) => {
            if (!permissionsSet.has(ap.permission.key)) {
              permissionsSet.add(ap.permission.key);
              permissionsList.push({
                id: ap.permission.id,
                key: ap.permission.key,
                description: ap.permission.description,
                category: ap.permission.category,
                source: 'mandatory_activity',
                activityName: act.name,
                moduleName: access.module.name,
              });
            }
          });
        });

      // Permissões de atividades opcionais
      access.activityAccess.forEach((actAccess) => {
        actAccess.activity.permissions.forEach((ap) => {
          if (!permissionsSet.has(ap.permission.key)) {
            permissionsSet.add(ap.permission.key);
            permissionsList.push({
              id: ap.permission.id,
              key: ap.permission.key,
              description: ap.permission.description,
              category: ap.permission.category,
              source: 'optional_activity',
              activityName: actAccess.activity.name,
              moduleName: access.module.name,
            });
          }
        });
      });
    });

    return {
      userId: id,
      userName: user.name,
      totalPermissions: permissionsList.length,
      permissions: permissionsList,
    };
  }
}
