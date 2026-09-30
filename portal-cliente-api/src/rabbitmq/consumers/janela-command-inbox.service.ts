import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JanelaCommand } from '../contracts/janela-command.contract';

/**
 * Aplica o comando de janela. Usa dedup por processedEvent porque `janela.criar`
 * não tem chave natural — sem isso, uma entrega duplicada criaria duas janelas.
 * O dedup e a escrita ficam na mesma transação (exactly-once). `atualizar`/
 * `remover` de uma janela já removida são no-op (P2025 engolido).
 */
@Injectable()
export class JanelaCommandInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async process(command: JanelaCommand): Promise<{ duplicate: boolean; op: string }> {
    const { payload } = command;
    return this.prisma.$transaction(async (tx) => {
      try {
        await tx.processedEvent.create({
          data: { eventId: command.commandId, eventType: command.eventType },
        });
      } catch (error) {
        if (this.isUniqueEvent(error)) return { duplicate: true, op: payload.op };
        throw error;
      }

      switch (payload.op) {
        case 'janela.criar':
          await tx.janelaAtendimento.create({ data: payload.janela });
          break;
        case 'janela.atualizar':
          try {
            await tx.janelaAtendimento.update({ where: { id: payload.id }, data: payload.patch });
          } catch (error) {
            if (!this.isNotFound(error)) throw error;
          }
          break;
        case 'janela.remover':
          try {
            await tx.janelaAtendimento.delete({ where: { id: payload.id } });
          } catch (error) {
            if (!this.isNotFound(error)) throw error;
          }
          break;
      }

      return { duplicate: false, op: payload.op };
    });
  }

  private isUniqueEvent(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      || typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
  }

  private isNotFound(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
      || typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2025';
  }
}
