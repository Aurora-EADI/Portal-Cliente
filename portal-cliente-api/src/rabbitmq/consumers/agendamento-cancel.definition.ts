export const AGENDAMENTO_CANCEL_COMMAND_DEFINITION = {
  eventType: 'agendamento.cancel.requested',
  version: 1,
  routingKey: 'agendamento.cancel.requested',
  queue: 'portal-cliente.agendamento.cancel.requested',
  retryExchange: 'portal.integration.commands.retry',
  deadLetterExchange: 'portal.integration.commands.dlx',
} as const;
