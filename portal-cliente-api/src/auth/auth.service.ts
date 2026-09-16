import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { auth, betterAuthProvisioningHeaders } from './better-auth';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionCredential(input: { name: string; email: string; password: string }) {
    const result = await auth.api.signUpEmail({
      body: input,
      headers: betterAuthProvisioningHeaders(),
    });
    return result.user;
  }

  async removeCredential(userId: string) {
    const context = await auth.$context;
    await context.internalAdapter.deleteUser(userId);
  }

  async getProfile(userId: string): Promise<{ user: Omit<User, never> }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        cliente: { select: { id: true, nome: true, cnpj: true } },
        despachante: { select: { id: true, codDespachante: true, nome: true } },
        transportadoraConta: { select: { id: true, nome: true, cnpj: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return { user };
  }
}
