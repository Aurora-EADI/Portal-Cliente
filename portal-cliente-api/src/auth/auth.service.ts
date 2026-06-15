import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { cliente: { select: { id: true, nome: true, cnpj: true } } },
    });
    if (!user) throw new UnauthorizedException();
    return { user };
  }
}
