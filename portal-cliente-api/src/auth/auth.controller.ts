import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import {
  clearAuthCookie,
  setAuthCookie,
  setRefreshCookie,
} from '../common/auth-cookie';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token, refreshToken, expires_at } = await this.authService.login(dto.email, dto.password);

    // O token sai apenas no cookie httpOnly, nunca no corpo da resposta.
    setAuthCookie(res, token);
    setRefreshCookie(res, refreshToken);
    return { user, expires_at };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    return { ok: true };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new BadRequestException('refreshToken é obrigatório');
    const result = await this.authService.refresh(refreshToken);
    setAuthCookie(res, result.token);
    setRefreshCookie(res, result.refreshToken);
    return { user: result.user, expires_at: result.expires_at };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return this.authService.getProfile((req.user as any).id);
  }
}
