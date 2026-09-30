import { Injectable } from '@nestjs/common';
import { AverbacaoTiposDocumentoReplicarEvent } from '../contracts/averbacao-tipos-documento.contract';
import { TiposDocumentoService } from '../../tipos-documento/tipos-documento.service';

/**
 * Aplica a replicação do catálogo. Não precisa de dedup por eventId: `replicar`
 * é upsert do catálogo inteiro por auroraId + desativação do que sumiu, então
 * reprocessar a mesma remessa converge para o mesmo estado.
 */
@Injectable()
export class AverbacaoTiposDocumentoInboxService {
  constructor(private readonly tipos: TiposDocumentoService) {}

  async process(event: AverbacaoTiposDocumentoReplicarEvent): Promise<{ recebidos: number; desativados: number }> {
    return this.tipos.replicar(event.payload.tipos);
  }
}
