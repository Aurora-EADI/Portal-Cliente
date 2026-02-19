import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaPostgresService as PrismaService } from "../../prisma/prisma.service";
import { TokenType } from "@prisma/client-postgres";
import * as crypto from "crypto";

/**
 * Interface para o payload do JWT
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  companyId?: string;
  type?: "access" | "refresh";
  exp?: number; // Timestamp de expiração (adicionado pelo JWT)
  iat?: number; // Timestamp de emissão (adicionado pelo JWT)
}

/**
 * Interface para metadados de segurança do token
 */
export interface TokenSecurityMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Serviço responsável por toda a lógica de gerenciamento de tokens
 * Implementa boas práticas de segurança e separação de responsabilidades
 */
@Injectable()
export class TokenService {
  // Constantes de configuração
  private readonly ACCESS_TOKEN_EXPIRY = "1h"; // 1 hora - tempo padrão para access tokens
  private readonly REFRESH_TOKEN_EXPIRY = "7d"; // 7 dias - tempo padrão para refresh tokens
  private readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Gera um par de tokens (access + refresh) para um usuário
   */
  async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    companyId?: string,
    metadata?: TokenSecurityMetadata,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.generateAccessToken(
      userId,
      email,
      role,
      companyId,
    );

    const refreshToken = await this.generateRefreshToken(
      userId,
      email,
      metadata,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Gera um access token JWT
   */
  private async generateAccessToken(
    userId: string,
    email: string,
    role: string,
    companyId?: string,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      companyId,
      type: "access",
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Gera um refresh token e salva no banco de dados
   */
  private async generateRefreshToken(
    userId: string,
    email: string,
    metadata?: TokenSecurityMetadata,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role: "", // Não incluímos role/companyId no refresh por segurança
      type: "refresh",
    };

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    const tokenHash = this.hashToken(refreshToken);
    await this.saveRefreshToken(userId, tokenHash, metadata);

    return refreshToken;
  }

  /**
   * Salva um refresh token no banco de dados
   */
  private async saveRefreshToken(
    userId: string,
    tokenHash: string,
    metadata?: TokenSecurityMetadata,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.userToken.create({
      data: {
        userId,
        token: tokenHash,
        type: TokenType.REFRESH,
        expiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });
  }

  /**
   * Valida um refresh token e retorna os dados do usuário
   */
  async validateRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(refreshToken) as JwtPayload;

      if (payload.type !== "refresh") {
        throw new Error("Token inválido: tipo incorreto");
      }

      const tokenHash = this.hashToken(refreshToken);
      const tokenRecord = await this.prisma.userToken.findFirst({
        where: {
          token: tokenHash,
          userId: payload.sub,
          type: TokenType.REFRESH,
          revokedAt: null,
          expiresAt: {
            gte: new Date(),
          },
        },
      });

      if (!tokenRecord) {
        throw new Error("Token inválido ou revogado");
      }

      await this.updateTokenLastUsed(tokenRecord.id);

      return payload;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Renova o access token usando um refresh token válido
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    const payload = await this.validateRefreshToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.companyId ?? undefined,
    );

    return { access_token: accessToken };
  }

  /**
   * Revoga um refresh token específico
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.userToken.updateMany({
      where: {
        token: tokenHash,
        type: TokenType.REFRESH,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revoga todos os refresh tokens de um usuário
   * Útil para logout de todas as sessões
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.userToken.updateMany({
      where: {
        userId,
        type: TokenType.REFRESH,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Limpa tokens expirados do banco de dados
   * Deve ser executado periodicamente (cron job)
   */
  async cleanExpiredTokens(): Promise<number> {
    const result = await this.prisma.userToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Limpa tokens revogados antigos (mais de 30 dias)
   * Mantém histórico por um tempo para auditoria
   */
  async cleanOldRevokedTokens(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.userToken.deleteMany({
      where: {
        revokedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return result.count;
  }

  /**
   * Lista todos os tokens ativos de um usuário
   * Útil para mostrar sessões ativas
   */
  async getUserActiveTokens(userId: string) {
    return this.prisma.userToken.findMany({
      where: {
        userId,
        type: TokenType.REFRESH,
        revokedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        createdAt: true,
        lastUsedAt: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
      },
      orderBy: {
        lastUsedAt: "desc",
      },
    });
  }

  /**
   * Atualiza a data de última utilização do token
   */
  private async updateTokenLastUsed(tokenId: string): Promise<void> {
    await this.prisma.userToken.update({
      where: { id: tokenId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Cria hash SHA256 do token para armazenamento seguro
   * Nunca armazenamos o token original no banco
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Decodifica um JWT sem validar (útil para debugging)
   * ATENÇÃO: Não use para validação de segurança!
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se um token JWT está expirado sem validar a assinatura
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }
}
