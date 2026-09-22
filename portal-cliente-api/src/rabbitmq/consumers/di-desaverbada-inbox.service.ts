import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DisAverbadaRemovedEvent } from '../contracts/event-envelope';
import { DisAverbadasEventos } from '../../dis/dis.eventos';

@Injectable()
export class DiDesaverbadaInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: DisAverbadasEventos,
  ) {}

  async process(
    event: DisAverbadaRemovedEvent,
  ): Promise<{ duplicate: boolean }> {
    const resultado = await this.prisma.$transaction(
      async (
        tx,
      ): Promise<
        | { duplicate: true }
        | {
            duplicate: false;
            removida: boolean;
            cnpjCliente: string | null;
            codDespachante: string | null;
          }
      > => {
        try {
          await tx.processedEvent.create({
            data: { eventId: event.eventId, eventType: event.eventType },
          });
        } catch (error) {
          if (this.isUniqueEvent(error)) return { duplicate: true };
          throw error;
        }

        const { nLote } = event.payload;

        // Lê o escopo antes de apagar: sem cnpjCliente/codDespachante o SSE não
        // sabe a quem entregar a remoção. Ausente = já removida (idempotente).
        const row = await tx.diAverbada.findUnique({
          where: { nLote },
          select: { cnpjCliente: true, codDespachante: true },
        });
        if (!row) {
          return {
            duplicate: false,
            removida: false,
            cnpjCliente: null,
            codDespachante: null,
          };
        }

        // Containers e atribuições saem por cascade (onDelete: Cascade).
        await tx.diAverbada.delete({ where: { nLote } });

        return {
          duplicate: false,
          removida: true,
          cnpjCliente: row.cnpjCliente,
          codDespachante: row.codDespachante,
        };
      },
    );

    // Depois do commit, como no create: o dashboard só deve ouvir um estado já
    // persistido.
    if (!resultado.duplicate && resultado.removida) {
      this.eventos.emitirRemocao({
        nLote: event.payload.nLote,
        cnpjCliente: resultado.cnpjCliente,
        codDespachante: resultado.codDespachante,
      });
    }

    return { duplicate: resultado.duplicate };
  }

  private isUniqueEvent(error: unknown): boolean {
    return (
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002') ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002')
    );
  }
}
