import { Injectable, MessageEvent } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { Observable, Subject, filter, from, interval, map, merge, switchMap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { DiParaAgendamento } from './di-averbada.mapper';

interface DiAverbadaEvento {
  /** Presente na chegada da DI; nulo na remoção, quando só o `nLote` importa. */
  di: DiParaAgendamento | null;
  nLote: string;
  /** `true` quando a DI foi desaverbada e deve sair do dashboard. */
  removida?: boolean;
  /** Chaves de escopo da DI, para entregar só a quem é dono. */
  cnpjCliente: string | null;
  codDespachante: string | null;
  /**
   * Contas de transportadora com atribuição nesta DI. Viaja no evento porque a
   * remoção apaga as atribuições por cascade: depois do commit não há mais como
   * descobrir a quem a DI pertencia. DI recém-averbada chega sem atribuição, e
   * a lista vazia é o que mantém o stream mudo para transportadora até o
   * importador ou o despachante atribuir a carga.
   */
  transportadoraContaIds?: string[];
}

/** Escopo já resolvido de um assinante do stream. */
type Escopo =
  | { tipo: 'todos' }
  | { tipo: 'cliente'; cnpjCliente: string }
  | { tipo: 'despachante'; codDespachante: string }
  | { tipo: 'transportadora'; contaId: string }
  | { tipo: 'nenhum' };

/**
 * Sem tráfego, proxies no caminho derrubam a conexão ociosa. O evento nomeado
 * `ping` não dispara o `onmessage` do navegador.
 */
const HEARTBEAT_MS = 25_000;

/**
 * Avisa o dashboard de agendamento quando uma DI averbada chega do Aurora (via
 * RabbitMQ), sem depender de F5. Em memória de propósito: a API roda numa
 * instância só — com réplicas, o canal precisa passar pelo RabbitMQ.
 */
@Injectable()
export class DisAverbadasEventos {
  private readonly alteracoes = new Subject<DiAverbadaEvento>();

  constructor(private readonly prisma: PrismaService) {}

  emitir(evento: DiAverbadaEvento): void {
    this.alteracoes.next(evento);
  }

  /** Sinaliza que a DI saiu (desaverbada): o front remove a linha pelo `nLote`. */
  emitirRemocao(evento: {
    nLote: string;
    cnpjCliente: string | null;
    codDespachante: string | null;
    transportadoraContaIds?: string[];
  }): void {
    this.alteracoes.next({ di: null, removida: true, ...evento });
  }

  /**
   * Só as DIs do próprio usuário — o cliente dono da carga ou o despachante que
   * a representa. ADMIN/EMPLOYEE veem todas. O escopo é resolvido uma vez, na
   * abertura da conexão, e o stream só começa depois disso.
   */
  paraUsuario(
    user: Pick<User, 'role' | 'clienteId' | 'despachanteId' | 'transportadoraContaId'>,
  ): Observable<MessageEvent> {
    return from(this.resolverEscopo(user)).pipe(
      switchMap((escopo) => {
        const eventos = this.alteracoes.pipe(
          filter((e) => this.pertence(e, escopo)),
          map((e): MessageEvent =>
            e.removida || !e.di
              ? { data: { nLote: e.nLote, removida: true } }
              : { data: e.di },
          ),
        );
        const heartbeat = interval(HEARTBEAT_MS).pipe(
          map((): MessageEvent => ({ type: 'ping', data: '' })),
        );
        return merge(eventos, heartbeat);
      }),
    );
  }

  private pertence(e: DiAverbadaEvento, escopo: Escopo): boolean {
    switch (escopo.tipo) {
      case 'todos':
        return true;
      case 'cliente':
        return e.cnpjCliente === escopo.cnpjCliente;
      case 'despachante':
        return e.codDespachante === escopo.codDespachante;
      case 'transportadora':
        return (e.transportadoraContaIds ?? []).includes(escopo.contaId);
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
    if (user.role === UserRole.CLIENTE && user.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: user.clienteId },
        select: { cnpj: true },
      });
      return cliente?.cnpj
        ? { tipo: 'cliente', cnpjCliente: cliente.cnpj }
        : { tipo: 'nenhum' };
    }
    if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
      const despachante = await this.prisma.despachante.findUnique({
        where: { id: user.despachanteId },
        select: { codDespachante: true },
      });
      return despachante
        ? { tipo: 'despachante', codDespachante: despachante.codDespachante }
        : { tipo: 'nenhum' };
    }
    if (user.role === UserRole.TRANSPORTADORA && user.transportadoraContaId) {
      return { tipo: 'transportadora', contaId: user.transportadoraContaId };
    }
    return { tipo: 'nenhum' };
  }
}
