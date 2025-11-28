import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // ID do usuário (subject)
  email: string; // Email do usuário
  role: string; // Papel do usuário (ADMIN ou SUPPLIER)
  companyId?: string; // ID da empresa (se for fornecedor)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Busca o usuário no banco pelo ID do payload
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { company: true }, // Inclui dados da empresa se houver
    });

    // Se o usuário não existir, token é inválido
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Retorna o usuário (sem a senha por segurança)
    // Este objeto será anexado a req.user nas rotas protegidas
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
