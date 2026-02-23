import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaPostgresService as PrismaService } from "../../prisma/prisma.service";
import { TokenType } from "@prisma/client";
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
  exp?: number; // Timestamp de expiraÃ§Ã£o (adicionado pelo JWT)
  iat?: number; // Timestamp de emissÃ£o (adicionado pelo JWT)
}

/**
 * Interface para metadados de seguranÃ§a do token
 */
export interface TokenSecurityMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * ServiÃ§o responsÃ¡vel por toda a lÃ³gica de gerenciamento de tokens
 * Implementa boas prÃ¡ticas de seguranÃ§a e separaÃ§Ã£o de responsabilidades
 */
@Injectable()
export class TokenService {
  // Constantes de configuraÃ§Ã£o
  private readonly ACCESS_TOKEN_EXPIRY = "1h"; // 1 hora - tempo padrÃ£o para access tokens
  private readonly REFRESH_TOKEN_EXPIRY = "7d"; // 7 dias - tempo padrÃ£o para refresh tokens
  private readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Gera um par de tokens (access + refresh) para um usuÃ¡rio
   */
  async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    companyId?: string,
    metadata?: TokenSecurityMetadata,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Gera access token (curta duraÃ§Ã£o)
    const accessToken = await this.generateAccessToken(
      userId,
      email,
      role,
      companyId,
    );

    // Gera refresh token (longa duraÃ§Ã£o)
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
    // Gera payload mÃ­nimo para o refresh token
    const payload: JwtPayload = {
      sub: userId,
      email,
      role: "", // NÃ£o incluÃ­mos role/companyId no refresh por seguranÃ§a
      type: "refresh",
    };

    // Gera o JWT
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    // Cria hash do token para armazenar no banco
    const tokenHash = this.hashToken(refreshToken);

    // Salva no banco de dados
    await this.saveRefreshToken(userId, tokenHash, metadata);

    // Retorna o token original (nÃ£o o hash)
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

    console.log("[TOKEN SERVICE] Salvando refresh token:", {
      userId,
      expiresAt,
      ipAddress: metadata?.ipAddress,
    });

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

    console.log("[TOKEN SERVICE] Refresh token salvo com sucesso");
  }

  /**
   * Valida um refresh token e retorna os dados do usuÃ¡rio
   */
  async validateRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      // Verifica assinatura e expiraÃ§Ã£o do JWT
      const payload = this.jwtService.verify(refreshToken) as JwtPayload;

      console.log("[TOKEN SERVICE] Refresh token decodificado:", {
        sub: payload.sub,
        type: payload.type,
        exp: payload.exp ? new Date(payload.exp * 1000) : "N/A",
      });

      // Valida tipo do token
      if (payload.type !== "refresh") {
        console.error(
          "[TOKEN SERVICE] Token com tipo incorreto:",
          payload.type,
        );
        throw new Error("Token invÃ¡lido: tipo incorreto");
      }

      // Verifica se o token existe e estÃ¡ vÃ¡lido no banco
      const tokenHash = this.hashToken(refreshToken);
      const tokenRecord = await this.prisma.userToken.findFirst({
        where: {
          token: tokenHash,
          userId: payload.sub,
          type: TokenType.REFRESH,
          revokedAt: null,
          expiresAt: {
            gte: new Date(), // NÃ£o expirado
          },
        },
      });

      if (!tokenRecord) {
        console.error(
          "[TOKEN SERVICE] Token nÃ£o encontrado no banco para userId:",
          payload.sub,
        );
        throw new Error("Token invÃ¡lido ou revogado");
      }

      console.log("[TOKEN SERVICE] Token vÃ¡lido, encontrado no banco");

      // Atualiza Ãºltima utilizaÃ§Ã£o
      await this.updateTokenLastUsed(tokenRecord.id);

      return payload;
    } catch (error: any) {
      console.error(
        "[TOKEN SERVICE] Erro ao validar refresh token:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Renova o access token usando um refresh token vÃ¡lido
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    // Valida o refresh token
    const payload = await this.validateRefreshToken(refreshToken);

    // Busca dados atualizados do usuÃ¡rio
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new Error("UsuÃ¡rio nÃ£o encontrado");
    }

    // Gera novo access token com dados atualizados
    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.companyId ?? undefined, // Converte null para undefined
    );

    return { access_token: accessToken };
  }

  /**
   * Revoga um refresh token especÃ­fico
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
   * Revoga todos os refresh tokens de um usuÃ¡rio
   * Ãštil para logout de todas as sessÃµes
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
          lt: new Date(), // Menor que data atual
        },
      },
    });

    return result.count;
  }

  /**
   * Limpa tokens revogados antigos (mais de 30 dias)
   * MantÃ©m histÃ³rico por um tempo para auditoria
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
   * Lista todos os tokens ativos de um usuÃ¡rio
   * Ãštil para mostrar sessÃµes ativas
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
   * Atualiza a data de Ãºltima utilizaÃ§Ã£o do token
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
   * Decodifica um JWT sem validar (Ãºtil para debugging)
   * ATENÃ‡ÃƒO: NÃ£o use para validaÃ§Ã£o de seguranÃ§a!
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se um token JWT estÃ¡ expirado sem validar a assinatura
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

