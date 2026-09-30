import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GestaoAcessoCommand } from '../contracts/gestao-acesso-command.contract';

/**
 * Aplica o comando de gestão de acesso. Ops simples de escrita (revogar convite,
 * ativar/desativar usuário) — feitas direto no Prisma para não acoplar o
 * RabbitMqModule ao ServiceModule (que importa o RabbitMqModule).
 *
 * Idempotência por estado: convite já revogado / usuário já no active alvo = no-op.
 */
@Injectable()
export class GestaoAcessoCommandInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async process(command: GestaoAcessoCommand): Promise<{ duplicate: boolean; op: string }> {
    const { payload } = command;

    switch (payload.op) {
      case 'convite.revogar': {
        const convite = await this.prisma.conviteRegistro.findUnique({
          where: { id: payload.conviteId },
          select: { id: true },
        });
        if (!convite) return { duplicate: true, op: payload.op };
        try {
          await this.prisma.conviteRegistro.delete({ where: { id: payload.conviteId } });
        } catch (error) {
          // Corrida: já removido entre o findUnique e o delete — objetivo atingido.
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { duplicate: true, op: payload.op };
          }
          throw error;
        }
        return { duplicate: false, op: payload.op };
      }
      case 'user.set-active': {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.userId },
          select: { active: true },
        });
        // Usuário inexistente: comando não tem o que aplicar; ack para não repetir.
        if (!user) return { duplicate: true, op: payload.op };
        if (user.active === payload.active) return { duplicate: true, op: payload.op };
        await this.prisma.user.update({
          where: { id: payload.userId },
          data: { active: payload.active },
        });
        return { duplicate: false, op: payload.op };
      }
    }
  }
}
