import { Injectable, Logger } from '@nestjs/common';
import { Modalidade, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TipoDocumentoReplicadoDto } from './dto/replicar-tipos-documento.dto';

@Injectable()
export class TiposDocumentoService {
  private readonly logger = new Logger(TiposDocumentoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Catálogo visível para o Despachante: só o que está ativo. */
  async listar(modalidade?: Modalidade) {
    const where: Prisma.TipoDocumentoWhereInput = { ativo: true };
    if (modalidade) where.modalidade = modalidade;

    return this.prisma.tipoDocumento.findMany({
      where,
      orderBy: [{ step: 'asc' }, { ordem: 'asc' }, { descricao: 'asc' }],
    });
  }

  /**
   * Recebe o catálogo inteiro do Aurora e o reflete aqui.
   *
   * Upsert por auroraId, então reenviar não duplica. O que sumiu do Aurora é
   * desativado, não apagado: documentos já enviados apontam para o tipo, e
   * apagar quebraria o histórico. Tudo numa transação — catálogo meio
   * atualizado deixaria o Despachante vendo exigência que não existe mais.
   */
  async replicar(tipos: TipoDocumentoReplicadoDto[]) {
    const idsRecebidos = tipos.map((t) => t.auroraId);

    const { desativados } = await this.prisma.$transaction(async (tx) => {
      const agora = new Date();

      for (const tipo of tipos) {
        const dados = {
          modalidade: tipo.modalidade,
          descricao: tipo.descricao,
          obrigatorio: tipo.obrigatorio,
          step: tipo.step,
          ativo: tipo.ativo,
          ordem: tipo.ordem ?? 0,
          sincronizadoEm: agora,
        };

        await tx.tipoDocumento.upsert({
          where: { auroraId: tipo.auroraId },
          create: { auroraId: tipo.auroraId, ...dados },
          update: dados,
        });
      }

      const { count } = await tx.tipoDocumento.updateMany({
        where: { auroraId: { notIn: idsRecebidos }, ativo: true },
        data: { ativo: false, sincronizadoEm: agora },
      });

      return { desativados: count };
    });

    this.logger.log(
      `Catálogo replicado: ${tipos.length} recebido(s), ${desativados} desativado(s) por ausência`,
    );

    return { recebidos: tipos.length, desativados };
  }
}
