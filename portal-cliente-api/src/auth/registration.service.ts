import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from './better-auth';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';
import { AuthService } from './auth.service';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getInvite(token: string) {
    const invite = await this.prisma.conviteRegistro.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Convite não encontrado');
    if (invite.usedAt) throw new ConflictException('Este convite já foi utilizado');
    if (invite.expiresAt < new Date()) throw new ConflictException('Este convite expirou');

    return {
      token: invite.token,
      tipo: invite.tipo,
      nome: invite.nome,
      email: invite.email,
    };
  }

  async register(dto: RegisterWithInviteDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const invite = await this.prisma.conviteRegistro.findUnique({
      where: { token: dto.token },
    });
    if (!invite) throw new BadRequestException('Convite não encontrado');
    if (invite.usedAt) throw new BadRequestException('Este convite já foi utilizado');
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Este convite expirou. Solicite um novo convite.');
    }

    const identity = await this.authService.provisionCredential({
      name: dto.nome.trim(),
      email,
      password: dto.senha,
    });

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        let clienteId: string | null = null;
        let despachanteId: string | null = null;
        let transportadoraContaId: string | null = null;

        if (invite.tipo === UserRole.DESPACHANTE && invite.codDespachante) {
          let despachante = await tx.despachante.findUnique({
            where: { codDespachante: invite.codDespachante },
          });
          if (!despachante) {
            despachante = await tx.despachante.create({
              data: {
                codDespachante: invite.codDespachante,
                nome: invite.nome,
                email,
                telefone: dto.telefone || null,
              },
            });
          } else if (!despachante.email) {
            await tx.despachante.update({
              where: { id: despachante.id },
              data: { email, telefone: dto.telefone || undefined },
            });
          }
          despachanteId = despachante.id;
        }

        if (invite.tipo === UserRole.CLIENTE && invite.cnpjCliente) {
          let cliente = await tx.cliente.findFirst({ where: { cnpj: invite.cnpjCliente } });
          if (!cliente) {
            cliente = await tx.cliente.create({
              data: {
                nome: invite.nome,
                cnpj: invite.cnpjCliente,
                email,
                telefone: dto.telefone || null,
              },
            });
          }
          clienteId = cliente.id;
        }

        if (invite.tipo === UserRole.TRANSPORTADORA && invite.cnpjTransportadora) {
          let transportadoraConta = await tx.transportadoraConta.findUnique({
            where: { cnpj: invite.cnpjTransportadora },
          });
          if (!transportadoraConta) {
            transportadoraConta = await tx.transportadoraConta.create({
              data: {
                cnpj: invite.cnpjTransportadora,
                nome: invite.nome,
                codTransp: invite.codTransp,
                email,
                telefone: dto.telefone || null,
              },
            });
          } else if (!transportadoraConta.email || !transportadoraConta.codTransp) {
            transportadoraConta = await tx.transportadoraConta.update({
              where: { id: transportadoraConta.id },
              data: {
                email: transportadoraConta.email ?? email,
                codTransp: transportadoraConta.codTransp ?? invite.codTransp,
              },
            });
          }
          transportadoraContaId = transportadoraConta.id;
        }

        const updatedInvite = await tx.conviteRegistro.updateMany({
          where: { id: invite.id, usedAt: null },
          data: { usedAt: new Date(), usedByUserId: identity.id },
        });
        if (updatedInvite.count !== 1) {
          throw new ConflictException('Este convite já foi utilizado');
        }

        return tx.user.update({
          where: { id: identity.id },
          data: {
            role: invite.tipo,
            active: true,
            clienteId,
            despachanteId,
            transportadoraContaId,
          },
          select: { id: true, name: true, email: true, role: true },
        });
      });

      return {
        message: 'Cadastro realizado com sucesso',
        user,
      };
    } catch (error) {
      try {
        const context = await auth.$context;
        await context.internalAdapter.deleteUser(identity.id);
      } catch {
        // A limpeza é best-effort; a falha original permanece a resposta.
      }
      throw error;
    }
  }
}
