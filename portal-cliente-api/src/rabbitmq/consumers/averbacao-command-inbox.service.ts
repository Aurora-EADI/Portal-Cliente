import { Injectable } from '@nestjs/common';
import { AverbacaoDocumentoStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AverbacoesService } from '../../averbacoes/averbacoes.service';
import { AverbacaoCommand } from '../contracts/averbacao-command.contract';

/**
 * Aplica o comando unificado de averbação.
 *
 * Idempotência por estado-alvo, não por tabela de eventos: entrega duplicada de
 * uma decisão cujo documento já está no status final é no-op. O próprio
 * `decidirDocumento` revalida EM_ANALISE dentro da transação, cobrindo corridas.
 */
@Injectable()
export class AverbacaoCommandInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly averbacoes: AverbacoesService,
  ) {}

  async process(command: AverbacaoCommand): Promise<{ duplicate: boolean; op: string }> {
    const { payload } = command;

    switch (payload.op) {
      case 'documento.aprovar': {
        if (await this.jaNoEstado(payload.documentoId, AverbacaoDocumentoStatus.VALIDADO)) {
          return { duplicate: true, op: payload.op };
        }
        await this.averbacoes.aprovarDocumento(payload.documentoId, payload.analisadoPor);
        return { duplicate: false, op: payload.op };
      }
      case 'documento.rejeitar': {
        if (await this.jaNoEstado(payload.documentoId, AverbacaoDocumentoStatus.REJEITADO)) {
          return { duplicate: true, op: payload.op };
        }
        await this.averbacoes.rejeitarDocumento(payload.documentoId, payload.motivo, payload.analisadoPor);
        return { duplicate: false, op: payload.op };
      }
      case 'processo.devolver': {
        const processo = await this.prisma.averbacaoProcesso.findUnique({
          where: { id: payload.processoId },
          select: { devolvidoEm: true, motivoDevolucao: true },
        });
        if (processo?.devolvidoEm && processo.motivoDevolucao === payload.motivo.trim()) {
          return { duplicate: true, op: payload.op };
        }
        await this.averbacoes.devolver(payload.processoId, payload.motivo, payload.devolvidoPor);
        return { duplicate: false, op: payload.op };
      }
    }
  }

  private async jaNoEstado(documentoId: string, alvo: AverbacaoDocumentoStatus): Promise<boolean> {
    const doc = await this.prisma.averbacaoDocumento.findUnique({
      where: { id: documentoId },
      select: { status: true },
    });
    return doc?.status === alvo;
  }
}
