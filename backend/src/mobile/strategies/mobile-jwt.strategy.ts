import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaPostgresService as PrismaService } from "../../prisma/prisma.service";

export interface MobileJwtPayload {
  sub: string;
  email: string;
  role: string;
  type: string;
}

@Injectable()
export class MobileJwtStrategy extends PassportStrategy(
  Strategy,
  "mobile-jwt",
) {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: MobileJwtPayload) {
    if (payload.type !== "mobile") {
      throw new UnauthorizedException("Token inválido para mobile");
    }

    const user = await this.prisma.userMobile.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException("Usuário mobile não encontrado");
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
