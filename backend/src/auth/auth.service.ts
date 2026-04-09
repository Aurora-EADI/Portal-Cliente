// src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import {
  ActivityPermissions,
  ModuleData,
  UserPermissionsResponse,
} from "./types/user-permissions.types";
import { TokenService, TokenSecurityMetadata } from "./services/token.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  /**
   * Realiza o login do usuário
   */
  async login(loginDto: LoginDto, metadata?: TokenSecurityMetadata) {
    const { email, password } = loginDto;

    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    // Verificação de Status da Empresa
    if (user.company) {
      if (user.company.status === "PENDING_ACTIVE") {
        throw new UnauthorizedException(
          "Seu cadastro está em análise. Aguarde a aprovação.",
        );
      }
      if (user.company.status === "REJECTED") {
        throw new UnauthorizedException(
          "Seu cadastro foi recusado. Entre em contato com o suporte.",
        );
      }
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    // Gerar par de tokens (access + refresh) usando o TokenService
    const { accessToken, refreshToken } =
      await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        user.role,
        user.companyId ?? undefined, // Converte null para undefined
        metadata,
      );

    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userWithoutPassword,
    };
  }

  /**
   * Renova o access token usando um refresh token válido
   */
  async refreshToken(refreshToken: string) {
    try {
      console.log("[AUTH SERVICE] Tentando renovar token...");
      const result = await this.tokenService.refreshAccessToken(refreshToken);
      console.log("[AUTH SERVICE] Token renovado com sucesso");
      return result;
    } catch (error: any) {
      console.error("[AUTH SERVICE] Erro ao renovar token:", error.message);
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }
  }

  /**
   * Realiza logout revogando o refresh token
   */
  async logout(refreshToken: string) {
    try {
      await this.tokenService.revokeRefreshToken(refreshToken);
      return { message: "Logout realizado com sucesso" };
    } catch (error) {
      // Mesmo se falhar, retorna sucesso (token pode já estar revogado)
      return { message: "Logout realizado com sucesso" };
    }
  }

  /**
   * Realiza logout de todas as sessões do usuário
   */
  async logoutAll(userId: string) {
    await this.tokenService.revokeAllUserTokens(userId);
    return { message: "Logout de todas as sessões realizado com sucesso" };
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
              role: "SUPPLIER",
            },
          },
        },
      });

      if (!existingCompany) {
        throw new BadRequestException("Empresa não encontrada");
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
        throw new ConflictException("Email já cadastrado para outra empresa");
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
            classification: company.classification,
            allocationRegime: company.allocationRegime,
            status: "PENDING_ACTIVE", // Atualiza status para aguardar aprovação
          },
        });

        await this._syncSupplierTypes(
          prisma,
          companyId,
          company.supplierTypeIds || [],
        );

        await this._syncCompanyWorkforce(
          prisma,
          companyId,
          company.allocationRegime,
          company.workforceEmployees || [],
        );

        // Se o usuário já existe para esta empresa, atualiza os dados
        // Caso contrário, cria um novo usuário
        if (existingUser && existingUser.companyId === companyId) {
          // UPDATE: Usuário já existe, apenas atualiza senha e nome
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name,
              password: hashedPassword,
              // Email não muda pois é o mesmo
            },
          });

          // Verifica se o usuário já tem permissões de Documentos
          const hasDocPermissions = await prisma.userModuleAccess.findFirst({
            where: {
              userId: existingUser.id,
              module: { route: "/documentos" },
            },
          });

          // Se não tem permissões, concede
          if (!hasDocPermissions) {
            await this._grantSupplierPermissions(prisma, existingUser.id);
          }
        } else {
          // CREATE: Novo usuário para esta empresa
          const newUser = await prisma.user.create({
            data: {
              name: user.name,
              email: user.email,
              password: hashedPassword,
              role: "SUPPLIER",
              companyId: companyId,
            },
          });

          // Libera permissões de Documentos apenas para novo usuário
          await this._grantSupplierPermissions(prisma, newUser.id);
        }
      });

      return {
        message:
          "Cadastro atualizado com sucesso. Aguardando aprovação do administrador.",
      };
    }

    // CENÁRIO 2: Criar nova empresa (comportamento original)
    // Remove apenas pontuação do CNPJ, preservando letras (CNPJ alfanumérico - RFB 2026)
    const cnpjClean = company.cnpj.replace(/[.\-\/]/g, '').toUpperCase();

    // Verifica se o email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new ConflictException("Email já cadastrado no sistema");
    }

    // Verifica se o CNPJ já existe
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        cnpj: {
          equals: cnpjClean,
          mode: 'insensitive',
        },
      },
    });

    if (existingCompany) {
      throw new ConflictException("CNPJ já cadastrado no sistema");
    }

    // Cria empresa e usuário em uma transação
    await this.prisma.$transaction(async (prisma) => {
      // Cria a empresa com status PENDING
      const newCompany = await prisma.company.create({
        data: {
          cnpj: cnpjClean, // Salva CNPJ sem pontuação, mas preservando letras
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
            classification: company.classification,
            allocationRegime: company.allocationRegime,
          status: "PENDING_ACTIVE", // Aguardando aprovação do admin
        },
      });

      await this._syncSupplierTypes(
        prisma,
        newCompany.id,
        company.supplierTypeIds || [],
      );

      await this._syncCompanyWorkforce(
        prisma,
        newCompany.id,
        company.allocationRegime,
        company.workforceEmployees || [],
      );

      // Cria o usuário vinculado à empresa com role SUPPLIER
      const newUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: "SUPPLIER", // Usuário que registra a empresa é SUPPLIER
          companyId: newCompany.id,
        },
      });

      // Libera permissões de Documentos
      await this._grantSupplierPermissions(prisma, newUser.id);
    });

    return {
      message:
        "Cadastro realizado com sucesso. Aguardando aprovação do administrador.",
    };
  }

  /**
   * Helper para conceder permissões padrão de Supplier (Documentos)
   */
  private async _grantSupplierPermissions(tx: any, userId: string) {
    // 1. Busca o módulo "/documentos"
    const docModule = await tx.module.findFirst({
      where: { route: "/documentos" },
    });

    if (!docModule) {
      console.warn(
        "[AUTH] Módulo /documentos não encontrado. Permissões não concedidas.",
      );
      return;
    }

    // 2. Busca a atividade "Anexar documento"
    const attachActivity = await tx.activity.findFirst({
      where: {
        moduleId: docModule.id,
        name: "Anexar documento",
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

  private async _syncSupplierTypes(
    tx: any,
    companyId: string,
    supplierTypeIds: string[],
  ) {
    if (!supplierTypeIds || supplierTypeIds.length === 0) {
      return;
    }

    const uniqueSupplierTypeIds = [...new Set(supplierTypeIds)];

    await tx.companySupplierType.deleteMany({
      where: { companyId },
    });

    await tx.companySupplierType.createMany({
      data: uniqueSupplierTypeIds.map((supplierTypeId) => ({
        companyId,
        supplierTypeId,
      })),
    });
  }

  private async _syncCompanyWorkforce(
    tx: any,
    companyId: string,
    allocationRegime: string | undefined,
    workforceEmployees: Array<{
      fullName: string;
      cpf: string;
      position: string;
      hiredAt: string;
    }>,
  ) {
    await tx.companyEmployee.deleteMany({ where: { companyId } });

    if (allocationRegime !== "FULL_WORKFORCE_AT_EADI") {
      return;
    }

    const validEmployees = workforceEmployees
      .map((employee) => ({
        fullName: employee.fullName?.trim(),
        cpf: employee.cpf?.replace(/\D/g, ""),
        position: employee.position?.trim(),
        hiredAt: employee.hiredAt,
      }))
      .filter(
        (employee) =>
          employee.fullName &&
          employee.cpf &&
          employee.position &&
          employee.hiredAt,
      );

    if (validEmployees.length === 0) {
      return;
    }

    await tx.companyEmployee.createMany({
      data: validEmployees.map((employee) => ({
        companyId,
        fullName: employee.fullName,
        cpf: employee.cpf,
        position: employee.position,
        hiredAt: new Date(employee.hiredAt),
      })),
    });
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
      console.log("[AUTH SERVICE] Usuário não tem módulos ativos");
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

    console.log("[AUTH SERVICE] Permissões encontradas:", finalPermissions);

    return {
      modules: modulesData,
      permissions: finalPermissions,
    };
  }
}
