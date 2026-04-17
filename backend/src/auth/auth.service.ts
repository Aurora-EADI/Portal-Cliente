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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        user.role,
        user.companyId ?? undefined,
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
      return await this.tokenService.refreshAccessToken(refreshToken);
    } catch {
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
    } catch {
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

    const hashedPassword = await bcrypt.hash(user.password, 10);

    // CENÁRIO 1: Atualizar empresa existente
    if (companyId) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          users: {
            where: { role: "SUPPLIER" },
          },
        },
      });

      if (!existingCompany) {
        throw new BadRequestException("Empresa não encontrada");
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser && existingUser.companyId !== companyId) {
        throw new ConflictException("Email já cadastrado para outra empresa");
      }

      await this.prisma.$transaction(async (prisma) => {
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
            status: "PENDING_ACTIVE",
          },
        });

        if (existingUser && existingUser.companyId === companyId) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name,
              password: hashedPassword,
            },
          });

          const hasDocPermissions = await prisma.userModuleAccess.findFirst({
            where: {
              userId: existingUser.id,
              module: { route: "/documentos" },
            },
          });

          if (!hasDocPermissions) {
            await this._grantSupplierPermissions(prisma, existingUser.id);
          }
        } else {
          const newUser = await prisma.user.create({
            data: {
              name: user.name,
              email: user.email,
              password: hashedPassword,
              role: "SUPPLIER",
              companyId: companyId,
            },
          });

          await this._grantSupplierPermissions(prisma, newUser.id);
        }
      });

      return {
        message:
          "Cadastro atualizado com sucesso. Aguardando aprovação do administrador.",
      };
    }

    // CENÁRIO 2: Criar nova empresa
    const cnpjNumbers = company.cnpj.replace(/\D/g, "");

    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new ConflictException("Email já cadastrado no sistema");
    }

    const existingCompany = await this.prisma.company.findFirst({
      where: {
        cnpj: {
          contains: cnpjNumbers,
        },
      },
    });

    if (existingCompany) {
      throw new ConflictException("CNPJ já cadastrado no sistema");
    }

    await this.prisma.$transaction(async (prisma) => {
      const newCompany = await prisma.company.create({
        data: {
          cnpj: cnpjNumbers,
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
          status: "PENDING_ACTIVE",
        },
      });

      const newUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: "SUPPLIER",
          companyId: newCompany.id,
        },
      });

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
    const docModule = await tx.module.findFirst({
      where: { route: "/documentos" },
    });

    if (!docModule) {
      return;
    }

    const attachActivity = await tx.activity.findFirst({
      where: {
        moduleId: docModule.id,
        name: "Anexar documento",
      },
    });

    const userModuleAccess = await tx.userModuleAccess.create({
      data: {
        userId,
        moduleId: docModule.id,
        isEnabled: true,
      },
    });

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

    if (userModules.length === 0) {
      return {
        modules: [],
        permissions: [],
      };
    }

    const permissionsSet = new Set<string>();
    const modulesData: ModuleData[] = [];

    for (const modAccess of userModules) {
      const moduleActivities: ActivityPermissions[] = [];

      for (const activity of modAccess.module.activities) {
        const specificAccess = modAccess.activityAccess.find(
          (a) => a.activityId === activity.id,
        );

        let isActive: boolean;
        if (activity.isMandatory) {
          isActive = true;
        } else {
          isActive = specificAccess?.isEnabled ?? false;
        }

        const activityPermissions = activity.permissions.map(
          (ap) => ap.permission.key,
        );

        moduleActivities.push({
          id: activity.id,
          name: activity.name,
          isMandatory: activity.isMandatory,
          isActive,
          permissions: activityPermissions,
        });

        if (isActive) {
          activityPermissions.forEach((p) => permissionsSet.add(p));
        }
      }

      modulesData.push({
        id: modAccess.module.id,
        name: modAccess.module.name,
        description: modAccess.module.description,
        isEnabled: modAccess.isEnabled,
        activities: moduleActivities,
      });
    }

    return {
      modules: modulesData,
      permissions: Array.from(permissionsSet),
    };
  }
}
