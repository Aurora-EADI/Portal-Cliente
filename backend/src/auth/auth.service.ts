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
      if (user.company.status === 'PENDING') {
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
   */
  async register(registerDto: RegisterDto) {
    const { company, user } = registerDto;

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

    // Hash da senha
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Cria empresa e usuário em uma transação
    await this.prisma.$transaction(async (prisma) => {
      // Cria a empresa com status PENDING
      const newCompany = await prisma.company.create({
        data: {
          cnpj: company.cnpj,
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
          status: 'PENDING', // Aguardando aprovação do admin
        },
      });

      // Cria o usuário vinculado à empresa com role SUPPLIER
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: 'SUPPLIER', // Usuário que registra a empresa é SUPPLIER
          companyId: newCompany.id,
        },
      });
    });

    return {
      message:
        'Cadastro realizado com sucesso. Aguardando aprovação do administrador.',
    };
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