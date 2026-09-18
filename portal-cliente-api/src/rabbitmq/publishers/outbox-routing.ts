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
