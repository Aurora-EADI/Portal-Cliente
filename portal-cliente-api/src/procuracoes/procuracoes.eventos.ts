import { Injectable, MessageEvent } from '@nestjs/common';
import { ProcuracaoStatus } from '@prisma/client';
import { Observable, Subject, filter, interval, map, merge } from 'rxjs';

export interface ProcuracaoAlterada {
  despachanteId: string;
  procuracaoId: string;
  clienteId: string;
  status: ProcuracaoStatus;
}

/**
 * Sem tráfego, proxies no caminho (Traefik, load balancer) derrubam a conexão
 * ociosa. O evento nomeado `ping` não dispara o `onmessage` do navegador.
 */
const HEARTBEAT_MS = 25_000;

/**
 * Avisa a tela de Procurações quando uma procuração muda — sobretudo a decisão
 * da equipe Aurora, que acontece em outro sistema e antes só aparecia no F5.
 *
 * Em memória de propósito: a API roda numa instância só. Com réplicas, o
 * evento nasceria numa e o navegador poderia estar ligado em outra — aí o
 * canal precisa passar pelo RabbitMQ.
 */
@Injectable()
export class ProcuracoesEventos {
  private readonly alteracoes = new Subject<ProcuracaoAlterada>();

  emitir(evento: ProcuracaoAlterada) {
    this.alteracoes.next(evento);
  }

  /** Só as procurações do próprio despachante — o canal não vaza a de outro. */
  doDespachante(despachanteId: string): Observable<MessageEvent> {
    const eventos = this.alteracoes.pipe(
      filter((e) => e.despachanteId === despachanteId),
      map(
        ({ procuracaoId, clienteId, status }): MessageEvent => ({
          data: { procuracaoId, clienteId, status },
        }),
      ),
    );

    const heartbeat = interval(HEARTBEAT_MS).pipe(
      map((): MessageEvent => ({ type: 'ping', data: '' })),
    );

    return merge(eventos, heartbeat);
  }
}
