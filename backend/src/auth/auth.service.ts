// src/auth/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaPostgresService as PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ActivityPermissions,
  ModuleData,
  UserPermissionsResponse,
} from './types/user-permissions.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  /**
   * Realiza o login do usuário
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificação de Status da Empresa
    if (user.company) {
      if (user.company.status === 'PENDING_ACTIVE') {
        throw new UnauthorizedException(
          'Seu cadastro está em análise. Aguarde a aprovação.',
        );
      }
      if (user.company.status === 'REJECTED') {
        throw new UnauthorizedException(
          'Seu cadastro foi recusado. Entre em contato com o suporte.',
        );
      }
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar token JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  /**
   * Realiza o registro de um novo usuário e empresa
   * Se companyId for fornecido, atualiza empresa existente e cria/atualiza usuário
   */
  async register(registerDto: RegisterDto) {
    const { company, user, companyId } = registerDto;

    // Hash da senha
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // CENÁRIO 1: Atualizar empresa existente
    if (companyId) {
      // Verifica se a empresa existe
      const existingCompany = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          users: {
            where: {
              role: 'SUPPLIER',
            },
          },
        },
      });

      if (!existingCompany) {
        throw new BadRequestException('Empresa não encontrada');
      }

      // IMPORTANTE: Impede criação de múltiplos usuários para a mesma empresa
      // Verifica se a empresa já tem algum usuário SUPPLIER cadastrado
      // if (existingCompany.users.length > 0) {
      //   throw new ConflictException(
      //     'Esta empresa já possui um usuário cadastrado. Faça login ou entre em contato com o administrador.',
      //   );
      // }

      // Verifica se o email já está sendo usado por outro usuário
      const existingUser = await this.prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser && existingUser.companyId !== companyId) {
        throw new ConflictException('Email já cadastrado para outra empresa');
      }

      // Atualiza empresa e cria o primeiro usuário em transação
      await this.prisma.$transaction(async (prisma) => {
        // Atualiza os dados da empresa
        await prisma.company.update({
          where: { id: companyId },
          data: {
            fantasyName: company.fantasyName,
            socialReason: company.socialReason,
            zipCode: company.zipCode,
            address: company.address,
            number: company.number,
            complement: company.complement,
            neighborhood: company.neighborhood,
            city: company.city,
            state: company.state,
            phone: company.phone,
            status: 'PENDING_ACTIVE', // Atualiza status para aguardar aprovação
          },
        });

        // Cria o primeiro (e único) usuário SUPPLIER para a empresa
        const newUser = await prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: 'SUPPLIER',
            companyId: companyId,
          },
        });

        // Libera permissões de Documentos
        await this._grantSupplierPermissions(prisma, newUser.id);
      });

      return {
        message: 'Cadastro atualizado com sucesso. Aguardando aprovação do administrador.',
      };
    }

    // CENÁRIO 2: Criar nova empresa (comportamento original)
    // Remove formatação do CNPJ para verificação (mantém apenas números)
    const cnpjNumbers = company.cnpj.replace(/\D/g, '');

    // Verifica se o email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado no sistema');
    }

    // Verifica se o CNPJ já existe (busca pelo CNPJ sem formatação)
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        cnpj: {
          contains: cnpjNumbers,
        },
      },
    });

    if (existingCompany) {
      throw new ConflictException('CNPJ já cadastrado no sistema');
    }

    // Cria empresa e usuário em uma transação
    await this.prisma.$transaction(async (prisma) => {
      // Cria a empresa com status PENDING
      const newCompany = await prisma.company.create({
        data: {
          cnpj: cnpjNumbers, // Salva CNPJ sem formatação
          fantasyName: company.fantasyName,
          socialReason: company.socialReason,
          zipCode: company.zipCode,
          address: company.address,
          number: company.number,
          complement: company.complement,
          neighborhood: company.neighborhood,
          city: company.city,
          state: company.state,
          phone: company.phone,
          status: 'PENDING_ACTIVE', // Aguardando aprovação do admin
        },
      });

      // Cria o usuário vinculado à empresa com role SUPPLIER
      const newUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: 'SUPPLIER', // Usuário que registra a empresa é SUPPLIER
          companyId: newCompany.id,
        },
      });

      // Libera permissões de Documentos
      await this._grantSupplierPermissions(prisma, newUser.id);
    });

    return {
      message:
        'Cadastro realizado com sucesso. Aguardando aprovação do administrador.',
    };
  }

  /**
   * Helper para conceder permissões padrão de Supplier (Documentos)
   */
  private async _grantSupplierPermissions(tx: any, userId: string) {
    // 1. Busca o módulo "/documentos"
    const docModule = await tx.module.findFirst({
      where: { route: '/documentos' },
    });

    if (!docModule) {
      console.warn('[AUTH] Módulo /documentos não encontrado. Permissões não concedidas.');
      return;
    }

    // 2. Busca a atividade "Anexar documento"
    const attachActivity = await tx.activity.findFirst({
      where: {
        moduleId: docModule.id,
        name: 'Anexar documento',
      },
    });

    if (!attachActivity) {
      console.warn('[AUTH] Atividade "Anexar documento" não encontrada.');
      // Ainda assim vamos liberar o módulo?
      // O requisito diz "liberar o modulo ... e a atividade"
      // Se não achar a atividade, pelo menos o módulo?
      // Vamos tentar criar o acesso ao módulo pelo menos.
    }

    // 3. Cria acesso ao Módulo
    const userModuleAccess = await tx.userModuleAccess.create({
      data: {
        userId,
        moduleId: docModule.id,
        isEnabled: true,
      },
    });

    // 4. Se achou a atividade, cria exceção habilitando-a
    if (attachActivity) {
      await tx.userActivityAccess.create({
        data: {
          userModuleAccessId: userModuleAccess.id,
          activityId: attachActivity.id,
          isEnabled: true,
        },
      });
    }
  }

  async getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
    console.log(`[AUTH SERVICE] Buscando permissões para User ID: ${userId}`);

    // Busca módulos ativos do usuário com toda a cadeia de relacionamentos
    const userModules = await this.prisma.userModuleAccess.findMany({
      where: { userId, isEnabled: true },
      include: {
        module: {
          include: {
            activities: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        activityAccess: true,
      },
    });

    // Se não tiver módulos, retorna vazio
    if (userModules.length === 0) {
      console.log('[AUTH SERVICE] Usuário não tem módulos ativos');
      return {
        modules: [],
        permissions: [],
      };
    }

    const permissionsSet = new Set<string>();
    const modulesData: ModuleData[] = [];

    // Processa cada módulo
    for (const modAccess of userModules) {
      const moduleActivities: ActivityPermissions[] = [];

      // Processa cada atividade do módulo
      for (const activity of modAccess.module.activities) {
        // Verifica se existe acesso específico (exceção) para esta atividade
        const specificAccess = modAccess.activityAccess.find(
          (a) => a.activityId === activity.id,
        );

        // Define se a atividade está ativa:
        // - Obrigatórias (isMandatory=true): SEMPRE ativas quando módulo habilitado
        // - Opcionais (isMandatory=false): só ativas se tiver registro explícito com isEnabled=true
        let isActive: boolean;
        if (activity.isMandatory) {
          // Atividades obrigatórias sempre ficam ativas (não podem ser desabilitadas)
          isActive = true;
        } else {
          // Atividades opcionais: só ativas se tiver registro com isEnabled=true
          isActive = specificAccess?.isEnabled ?? false;
        }

        // Extrai as chaves de permissão técnicas (ex: LOG_VIEW_FLEET)
        const activityPermissions = activity.permissions.map(
          (ap) => ap.permission.key,
        );

        // Adiciona atividade ao array
        moduleActivities.push({
          id: activity.id,
          name: activity.name,
          isMandatory: activity.isMandatory,
          isActive,
          permissions: activityPermissions,
        });

        // Se a atividade está ativa, adiciona suas permissões ao Set
        if (isActive) {
          activityPermissions.forEach((p) => permissionsSet.add(p));
        }
      }

      // Adiciona módulo ao array
      modulesData.push({
        id: modAccess.module.id,
        name: modAccess.module.name,
        description: modAccess.module.description,
        isEnabled: modAccess.isEnabled,
        activities: moduleActivities,
      });
    }

    // Converte Set para Array
    const finalPermissions = Array.from(permissionsSet);

    console.log('[AUTH SERVICE] Permissões encontradas:', finalPermissions);

    return {
      modules: modulesData,
      permissions: finalPermissions,
    };
  }


}