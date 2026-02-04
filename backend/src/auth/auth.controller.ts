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
  Ip,
  Headers,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
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
      "Login realizado com sucesso. Retorna access_token e refresh_token",
  })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.login(loginDto, { ipAddress, userAgent });
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
   * Renova o access token usando o refresh token
   */
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Renovar access token usando refresh token" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        refresh_token: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Token renovado com sucesso" })
  @ApiResponse({
    status: 400,
    description: "Refresh token inválido ou expirado",
  })
  async refreshToken(@Body("refresh_token") refreshToken: string) {
    console.log("[AUTH CONTROLLER] Requisição de refresh recebida");
    console.log("[AUTH CONTROLLER] Refresh token presente:", !!refreshToken);

    if (!refreshToken) {
      console.error("[AUTH CONTROLLER] Refresh token não fornecido");
      throw new BadRequestException("Refresh token é obrigatório");
    }

    return this.authService.refreshToken(refreshToken);
  }

  /**
   * Realiza logout revogando o refresh token
   */
  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fazer logout (revogar sessão atual)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        refresh_token: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Logout realizado com sucesso" })
  async logout(@Body("refresh_token") refreshToken: string) {
    if (!refreshToken) {
      // Retorna sucesso mesmo sem token (idempotente)
      return { message: "Logout realizado com sucesso" };
    }
    return this.authService.logout(refreshToken);
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
  async logoutAll(@Request() req) {
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
  async getProfile(@Request() req) {
    // Busca as permissões do usuário
    const permissions = await this.authService.getUserPermissions(req.user.id);

    return {
      message: "Usuário autenticado",
      user: req.user,
      permissions,
    };
  }
}
