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
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, { ipAddress, userAgent });
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Renova o access token usando o refresh token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    console.log('[AUTH CONTROLLER] Requisição de refresh recebida');
    console.log('[AUTH CONTROLLER] Refresh token presente:', !!refreshToken);

    if (!refreshToken) {
      console.error('[AUTH CONTROLLER] Refresh token não fornecido');
      throw new BadRequestException('Refresh token é obrigatório');
    }

    return this.authService.refreshToken(refreshToken);
  }

  /**
   * Realiza logout revogando o refresh token
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      // Retorna sucesso mesmo sem token (idempotente)
      return { message: 'Logout realizado com sucesso' };
    }
    return this.authService.logout(refreshToken);
  }

  /**
   * Realiza logout de todas as sessões do usuário
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Request() req) {
    return this.authService.logoutAll(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    // Busca as permissões do usuário
    const permissions = await this.authService.getUserPermissions(req.user.id);

    return {
      message: 'Usuário autenticado',
      user: req.user,
      permissions,
    };
  }
}