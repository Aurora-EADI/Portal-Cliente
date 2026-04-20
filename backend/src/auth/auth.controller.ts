// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
  Ip,
  Headers,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import type { Response } from "express";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Public } from "../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fazer login no sistema" })
  @ApiResponse({
    status: 200,
    description:
      "Login realizado com sucesso. Seta cookies httpOnly access_token e refresh_token.",
  })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto, {
      ipAddress,
      userAgent,
    });

    const isProduction = process.env.ENVIRONMENT === "production";

    res.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("refresh_token", result.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    return { user: result.user, expires_at: expiresAt };
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Registrar nova empresa e usuário" })
  @ApiResponse({
    status: 201,
    description: "Empresa e usuário criados com sucesso",
  })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos ou empresa já cadastrada",
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Renova o access token via cookie refresh_token
   */
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Renovar access token via cookie refresh_token",
    description:
      "Lê o refresh_token do cookie httpOnly e seta novo access_token. " +
      "Para testes via Swagger, use o header Authorization: Bearer <refresh_token>.",
  })
  @ApiResponse({ status: 200, description: "Token renovado com sucesso" })
  @ApiResponse({
    status: 400,
    description: "Refresh token ausente ou inválido",
  })
  async refreshToken(
    @Request() req: { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new BadRequestException("Refresh token é obrigatório");
    }

    const result = await this.authService.refreshToken(refreshToken);

    const isProduction = process.env.ENVIRONMENT === "production";

    res.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    return { expires_at: expiresAt };
  }

  /**
   * Realiza logout limpando os cookies de sessão
   */
  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fazer logout (limpar cookies de sessão)" })
  @ApiResponse({ status: 200, description: "Logout realizado com sucesso" })
  async logout(
    @Request() req: { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const isProduction = process.env.ENVIRONMENT === "production";

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/api/auth/refresh",
    });

    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      return this.authService.logout(refreshToken);
    }

    return { message: "Logout realizado com sucesso" };
  }

  /**
   * Realiza logout de todas as sessões do usuário
   */
  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fazer logout de todas as sessões do usuário" })
  @ApiResponse({
    status: 200,
    description: "Logout de todas as sessões realizado com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  async logoutAll(@Request() req: { user: { id: string } }) {
    return this.authService.logoutAll(req.user.id);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obter dados do usuário autenticado" })
  @ApiResponse({
    status: 200,
    description: "Dados do usuário retornados com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  async getProfile(@Request() req: { user: { id: string } }) {
    const permissions = await this.authService.getUserPermissions(req.user.id);

    return {
      message: "Usuário autenticado",
      user: req.user,
      permissions,
    };
  }
}
