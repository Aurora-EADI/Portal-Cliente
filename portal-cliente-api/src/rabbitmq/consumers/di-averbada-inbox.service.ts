import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DisAverbadaCreatedEvent } from '../contracts/event-envelope';

@Injectable()
export class DiAverbadaInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async process(event: DisAverbadaCreatedEvent): Promise<{ duplicate: boolean }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        try {
          await tx.processedEvent.create({
            data: { eventId: event.eventId, eventType: event.eventType },
          });
        } catch (error) {
          if (this.isUniqueEvent(error)) return { duplicate: true };
          throw error;
        }

        const { payload } = event;
        const containerData = payload.idContainers.map((externalId) => ({ externalId }));
        await tx.diAverbada.upsert({
          where: { nLote: payload.nLote },
          create: {
            nLote: payload.nLote,
            auroraDiId: payload.diId,
            numeroDI: payload.numeroDI,
            cpfMotorista: payload.cpfMotorista,
            placaVeiculo: payload.placaVeiculo,
            dtAverbacao: new Date(payload.dtAverbacao),
            averbadoEm: new Date(payload.dtAverbacao),
            status: 'liberada',
            containerIds: { createMany: { data: containerData, skipDuplicates: true } },
          },
          update: {
            auroraDiId: payload.diId,
            numeroDI: payload.numeroDI,
            cpfMotorista: payload.cpfMotorista,
            placaVeiculo: payload.placaVeiculo,
            dtAverbacao: new Date(payload.dtAverbacao),
            averbadoEm: new Date(payload.dtAverbacao),
            sincronizadoEm: new Date(),
            containerIds: {
              deleteMany: {},
              createMany: { data: containerData, skipDuplicates: true },
            },
          },
        });
        return { duplicate: false };
      });
    } catch (error) {
      throw error;
    }
  }

  private isUniqueEvent(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      || typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
