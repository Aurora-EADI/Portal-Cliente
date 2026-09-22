import { Injectable, MessageEvent } from '@nestjs/common';
import { AverbacaoProcessoStatus } from '@prisma/client';
import { Observable, Subject, filter, interval, map, merge } from 'rxjs';

export interface AverbacaoAlterada {
  /** Nulo enquanto o processo não foi vinculado a um despachante do SIAUM. */
  despachanteId: string | null;
  clienteId: string;
  processoId: string;
  status: AverbacaoProcessoStatus;
}

/**
 * Sem tráfego, proxies no caminho (Traefik, load balancer) derrubam a conexão
 * ociosa. O evento nomeado `ping` não dispara o `onmessage` do navegador.
 */
const HEARTBEAT_MS = 25_000;

/**
 * Avisa a tela de Averbação Aduaneira quando um processo muda — sobretudo a
 * liberação decidida pela equipe Aurora, que acontece em outro sistema e antes
 * só aparecia no F5.
 *
 * Em memória de propósito: a API roda numa instância só. Com réplicas, o evento
 * nasceria numa e o navegador poderia estar ligado em outra — aí o canal
 * precisa passar pelo RabbitMQ.
 */
@Injectable()
export class AverbacoesEventos {
  private readonly alteracoes = new Subject<AverbacaoAlterada>();

  emitir(evento: AverbacaoAlterada) {
    this.alteracoes.next(evento);
  }

  /**
   * Só os processos do próprio usuário — o despachante que abriu ou o cliente
   * dono da carga. O canal não vaza o processo de outro. ADMIN/EMPLOYEE, sem
   * despachante nem cliente, recebem só o heartbeat.
   */
  paraUsuario(user: {
    despachanteId?: string | null;
    clienteId?: string | null;
  }): Observable<MessageEvent> {
    const eventos = this.alteracoes.pipe(
      filter(
        (e) =>
          (!!user.despachanteId && e.despachanteId === user.despachanteId) ||
          (!!user.clienteId && e.clienteId === user.clienteId),
      ),
      map(
        ({ processoId, clienteId, status }): MessageEvent => ({
          data: { processoId, clienteId, status },
        }),
      ),
    );

    const heartbeat = interval(HEARTBEAT_MS).pipe(
      map((): MessageEvent => ({ type: 'ping', data: '' })),
    );

    return merge(eventos, heartbeat);
  }
}
