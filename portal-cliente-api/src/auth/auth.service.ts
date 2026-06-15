import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.active) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const payload = { sub: user.id, email: user.email, role: user.role, clienteId: user.clienteId };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '1h'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.userToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('access_token', accessToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, expires_at: expiresAt.toISOString() };
  }

  async refresh(refreshToken: string, res: Response) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      }) as { sub: string; email: string; role: string };

      const stored = await this.prisma.userToken.findUnique({ where: { token: refreshToken } });
      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.active) throw new UnauthorizedException();

      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwt.sign(newPayload, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '1h'),
      });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      res.cookie('access_token', accessToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 1000 });
      return { expires_at: expiresAt.toISOString() };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      await this.prisma.userToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      }).catch(() => {});
    }
    res.clearCookie('access_token', COOKIE_OPTS);
    res.clearCookie('refresh_token', COOKIE_OPTS);
    return { message: 'Logout realizado com sucesso' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { cliente: { select: { id: true, nome: true, cnpj: true } } },
    });
    if (!user) throw new UnauthorizedException();
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }
}
