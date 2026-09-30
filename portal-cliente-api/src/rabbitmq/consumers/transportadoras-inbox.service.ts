import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransportadorasReplicarEvent } from '../contracts/transportadoras-replicar.contract';

/**
 * Aplica a replicação da carteira de transportadoras. Upsert por cnpj (Prisma
 * direto, para não acoplar o RabbitMqModule ao ServiceModule). Idempotente:
 * reprocessar a mesma remessa converge para o mesmo estado.
 */
@Injectable()
export class TransportadorasInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async process(event: TransportadorasReplicarEvent): Promise<{ synced: number; skipped: number }> {
    let synced = 0;
    let skipped = 0;

    for (const item of event.payload.items) {
      const cnpj = String(item.cnpj_cpf ?? '').replace(/\D/g, '');
      const nome = item.nomefantasia ?? item.razaosocial;
      if (cnpj.length !== 14 || !nome) {
        skipped += 1;
        continue;
      }
      await this.prisma.transportadoraConta.upsert({
        where: { cnpj },
        create: {
          cnpj,
          nome,
          codTransp: item.cod_transp ? String(item.cod_transp) : null,
          email: item.emails ?? null,
          telefone: item.telefones_contato ?? null,
        },
        update: {
          nome,
          ...(item.cod_transp ? { codTransp: String(item.cod_transp) } : {}),
        },
      });
      synced += 1;
    }

    return { synced, skipped };
  }
}
