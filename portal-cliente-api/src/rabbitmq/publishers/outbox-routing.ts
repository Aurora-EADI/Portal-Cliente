export interface OutboxRouteConfig {
  eventsExchange: string;
  commandsExchange: string;
}

export interface OutboxRoute {
  exchange: string;
  routingKey: string;
}

const EVENT_EXCHANGE_TYPES = new Set([
  'agendamento.status-changed',
  'agendamento.command-rejected',
  'agendamento.command-completed',
  'dis.averbada.created',
  // Consumidos pelo Portal Aurora para atualizar telas em tempo real (SSE).
  // Sem estas entradas o worker lançava OUTBOX_ROUTE_UNMAPPED e os eventos
  // ficavam PENDING para sempre — a fila de validação nunca se mexia sozinha.
  'averbacao.processo.atualizado',
  'procuracao.atualizada',
]);

export function resolveOutboxRoute(eventType: string, config: OutboxRouteConfig): OutboxRoute {
  if (eventType === 'agendamento.cancel.requested') {
    return { exchange: config.commandsExchange, routingKey: eventType };
  }
  if (EVENT_EXCHANGE_TYPES.has(eventType)) {
    return { exchange: config.eventsExchange, routingKey: eventType };
  }
  throw new Error('OUTBOX_ROUTE_UNMAPPED');
}
