import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload, { expiresIn: '1h' });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.userToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        type: 'REFRESH',
        expiresAt,
      },
    });

    return { token, refreshToken, expires_at: expiresAt };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !user.active) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Email ou senha inválidos');

    const tokens = await this.generateTokens(user);

    const { password: _password, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async refresh(refreshToken: string) {
    const userToken = await this.prisma.userToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!userToken || userToken.type !== 'REFRESH' || userToken.revokedAt || userToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // Revoke old token
    await this.prisma.userToken.update({
      where: { id: userToken.id },
      data: { revokedAt: new Date() },
    });

    if (!userToken.user.active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const tokens = await this.generateTokens(userToken.user);

    const { password: _password, ...safeUser } = userToken.user;
    return { user: safeUser, ...tokens };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { cliente: { select: { id: true, nome: true, cnpj: true } } },
    });
    if (!user) throw new UnauthorizedException();
    const { password: _password, ...safeUser } = user;
    return { user: safeUser };
  }
}
