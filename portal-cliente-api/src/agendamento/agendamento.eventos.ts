import { Injectable, MessageEvent } from '@nestjs/common';
import { AgendamentoStatus, User, UserRole } from '@prisma/client';
import { Observable, Subject, filter, from, interval, map, merge, switchMap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * O que viaja para a tela. De propósito é pequeno: só a identidade, o status e a
 * versão. O front faz merge disso sobre a linha que já tem, em vez de substituir
 * — o relê do `changeStatus` não inclui a DI, e substituir a linha zeraria DI e
 * container a cada troca de status.
 *
 * `criado: true` marca o agendamento que acabou de nascer, para o front buscar o
 * resto em vez de tentar montar a linha com esses quatro campos.
 */
export interface AgendamentoStatusEvento {
  id: string;
  status: AgendamentoStatus;
  previousStatus: AgendamentoStatus | null;
  aggregateVersion: number;
  criado?: boolean;
  /** Chaves de escopo: viajam no evento para o filtro não ir ao banco por evento. */
  clienteId: string | null;
  transportadoraContaId: string | null;
}

/** Escopo já resolvido de um assinante do stream. */
type Escopo =
  | { tipo: 'todos' }
  | { tipo: 'clientes'; clienteIds: string[] }
  | { tipo: 'transportadora'; contaId: string }
  | { tipo: 'nenhum' };

/**
 * Sem tráfego, proxies no caminho derrubam a conexão ociosa. O evento nomeado
 * `ping` não dispara o `onmessage` do navegador.
 */
const HEARTBEAT_MS = 25_000;

/**
 * Avisa o dashboard de agendamento quando o status muda no Aurora, sem depender
 * de F5. Em memória de propósito: a API roda numa instância só — com réplicas,
 * quem estiver conectado na instância que não atendeu a escrita não recebe nada,
 * e o canal precisaria passar pelo RabbitMQ.
 *
 * Vive em módulo próprio (`AgendamentoEventosModule`) para haver um Subject só:
 * declarado em dois módulos, o Nest instancia dois e o stream fica mudo.
 */
@Injectable()
export class AgendamentoEventos {
  private readonly alteracoes = new Subject<AgendamentoStatusEvento>();

  constructor(private readonly prisma: PrismaService) {}

  /** Mudança de status. Chame **depois** do commit, nunca de dentro da transação. */
  emitirStatus(
    agendamento: { id: string; status: AgendamentoStatus; clienteId: string | null; transportadoraContaId: string | null },
    previousStatus: AgendamentoStatus | null,
    aggregateVersion: number,
  ): void {
    this.alteracoes.next({
      id: agendamento.id,
      status: agendamento.status,
      previousStatus,
      aggregateVersion,
      clienteId: agendamento.clienteId,
      transportadoraContaId: agendamento.transportadoraContaId,
    });
  }

  /** Agendamento recém-criado: a linha ainda não existe na tela de ninguém. */
  emitirCriacao(agendamento: {
    id: string;
    status: AgendamentoStatus;
    aggregateVersion?: number;
    clienteId: string | null;
    transportadoraContaId: string | null;
  }): void {
    this.alteracoes.next({
      id: agendamento.id,
      status: agendamento.status,
      previousStatus: null,
      aggregateVersion: agendamento.aggregateVersion ?? 0,
      criado: true,
      clienteId: agendamento.clienteId,
      transportadoraContaId: agendamento.transportadoraContaId,
    });
  }

  /**
   * Só os agendamentos do próprio usuário. ADMIN/EMPLOYEE veem todos. O escopo é
   * resolvido uma vez, na abertura da conexão, e o stream só começa depois disso
   * — espelha `escopoAgendamento`, do lado da listagem.
   */
  paraUsuario(
    user: Pick<User, 'role' | 'clienteId' | 'despachanteId' | 'transportadoraContaId'>,
  ): Observable<MessageEvent> {
    return from(this.resolverEscopo(user)).pipe(
      switchMap((escopo) => {
        const eventos = this.alteracoes.pipe(
          filter((e) => this.pertence(e, escopo)),
          // As chaves de escopo ficam no servidor: não interessam à tela e
          // dizem a quem mais o agendamento pertence.
          map(({ clienteId, transportadoraContaId, ...evento }): MessageEvent => ({ data: evento })),
        );
        const heartbeat = interval(HEARTBEAT_MS).pipe(
          map((): MessageEvent => ({ type: 'ping', data: '' })),
        );
        return merge(eventos, heartbeat);
      }),
    );
  }

  private pertence(e: AgendamentoStatusEvento, escopo: Escopo): boolean {
    switch (escopo.tipo) {
      case 'todos':
        return true;
      case 'clientes':
        return e.clienteId !== null && escopo.clienteIds.includes(e.clienteId);
      case 'transportadora':
        return e.transportadoraContaId === escopo.contaId;
      default:
        return false;
    }
  }

  private async resolverEscopo(
    user: Pick<User, 'role' | 'clienteId' | 'despachanteId' | 'transportadoraContaId'>,
  ): Promise<Escopo> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.EMPLOYEE) {
      return { tipo: 'todos' };
    }
    if (user.role === UserRole.CLIENTE) {
      return user.clienteId ? { tipo: 'clientes', clienteIds: [user.clienteId] } : { tipo: 'nenhum' };
    }
    if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
      const clienteIds = await this.clientesDoDespachante(user.despachanteId);
      return clienteIds.length ? { tipo: 'clientes', clienteIds } : { tipo: 'nenhum' };
    }
    if (user.role === UserRole.TRANSPORTADORA && user.transportadoraContaId) {
      return { tipo: 'transportadora', contaId: user.transportadoraContaId };
    }
    return { tipo: 'nenhum' };
  }

  /**
   * Mesma derivação de `AgendamentoService.clientesDoDespachante`, duplicada aqui
   * para este módulo não importar o de agendamento — quem emite é o consumer, e
   * o ciclo de imports voltaria a criar dois Subjects.
   *
   * A carteira muda com o tempo; como o escopo é resolvido na abertura, cliente
   * que entra durante a sessão só aparece na próxima conexão.
   */
  private async clientesDoDespachante(despachanteId: string): Promise<string[]> {
    const despachante = await this.prisma.despachante.findUnique({
      where: { id: despachanteId },
      select: { codDespachante: true },
    });
    if (!despachante) return [];

    const lotes = await this.prisma.diAverbada.findMany({
      where: { codDespachante: despachante.codDespachante, cnpjCliente: { not: null } },
      select: { cnpjCliente: true },
      distinct: ['cnpjCliente'],
    });
    const cnpjs = lotes.map((l) => l.cnpjCliente).filter((c): c is string => Boolean(c));
    if (!cnpjs.length) return [];

    const clientes = await this.prisma.cliente.findMany({
      where: { cnpj: { in: cnpjs } },
      select: { id: true },
    });
    return clientes.map((c) => c.id);
  }
}
