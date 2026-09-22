import { Injectable } from '@nestjs/common';
import { DiAverbada, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DisAverbadaCreatedEvent } from '../contracts/event-envelope';
import { DisAverbadasEventos } from '../../dis/dis.eventos';
import { mapDiAverbadaToDI } from '../../dis/di-averbada.mapper';

@Injectable()
export class DiAverbadaInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: DisAverbadasEventos,
  ) {}

  async process(event: DisAverbadaCreatedEvent): Promise<{ duplicate: boolean }> {
    const resultado = await this.prisma.$transaction(
      async (tx): Promise<{ duplicate: true } | { duplicate: false; row: DiAverbada }> => {
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
        const averbadoEm = new Date(payload.dtAverbacao);
        const dtEntrada = payload.dtEntrada ? new Date(payload.dtEntrada) : null;

        // Campos descritivos comuns ao create e ao update. Motorista/placa ficam
        // de fora aqui de propósito: no update eles não podem ser sobrescritos
        // com null, senão um reenvio da averbação apagaria o que o cliente já
        // atribuiu no "Atribuir | Agendar".
        const descritivos = {
          nConhecimento: payload.nConhecimento ?? null,
          dta: payload.dta ?? null,
          documentoSaida: payload.documentoSaida ?? null,
          tipoDocumento: payload.tipoDocumento ?? null,
          modalidade: payload.modalidade ?? null,
          cliente: payload.cliente ?? null,
          cnpjCliente: payload.cnpjCliente ?? null,
          codDespachante: payload.codDespachante ?? null,
          despachante: payload.despachante ?? null,
          saldo: payload.saldo ?? null,
          dtEntrada,
          localizacao: payload.localizacao ?? null,
          containers: payload.containers ?? (payload.idContainers.join(' / ') || null),
          auroraDiId: payload.diId ?? null,
          numeroDI: payload.numeroDI ?? null,
          dtAverbacao: averbadoEm,
        };

        const row = await tx.diAverbada.upsert({
          where: { nLote: payload.nLote },
          create: {
            nLote: payload.nLote,
            ...descritivos,
            cpfMotorista: payload.cpfMotorista ?? null,
            placaVeiculo: payload.placaVeiculo ?? null,
            averbadoEm,
            status: 'liberada',
            containerIds: { createMany: { data: containerData, skipDuplicates: true } },
          },
          update: {
            ...descritivos,
            // Preserva motorista/placa já atribuídos: só grava quando o evento
            // realmente traz o dado (reenvio de averbação vem sem eles).
            ...(payload.cpfMotorista ? { cpfMotorista: payload.cpfMotorista } : {}),
            ...(payload.placaVeiculo ? { placaVeiculo: payload.placaVeiculo } : {}),
            averbadoEm,
            sincronizadoEm: new Date(),
            containerIds: {
              deleteMany: {},
              createMany: { data: containerData, skipDuplicates: true },
            },
          },
        });
        return { duplicate: false, row };
      },
    );

    // Fora da transação, depois do commit: o dashboard relê pelo stream. Avisar
    // antes faria o navegador buscar um estado ainda não persistido.
    if (!resultado.duplicate) {
      this.eventos.emitir({
        di: mapDiAverbadaToDI(resultado.row),
        nLote: resultado.row.nLote,
        cnpjCliente: resultado.row.cnpjCliente,
        codDespachante: resultado.row.codDespachante,
      });
    }

    return { duplicate: resultado.duplicate };
  }

  private isUniqueEvent(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      || typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
