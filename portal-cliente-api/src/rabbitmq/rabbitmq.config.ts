export const RABBITMQ_DEFAULTS = {
  exchange: 'portal.integration.events',
  retryExchange: 'portal.integration.retry',
  deadLetterExchange: 'portal.integration.dlx',
  commandExchange: 'portal.integration.commands',
  commandRetryExchange: 'portal.integration.commands.retry',
  commandDeadLetterExchange: 'portal.integration.commands.dlx',
  diAverbadaQueue: 'portal-cliente.dis-averbada.created',
  diAverbadaRetryQueue: 'portal-cliente.dis-averbada.created.retry.30s',
  diAverbadaDlq: 'portal-cliente.dis-averbada.created.dlq',
  agendamentoCancelQueue: 'portal-cliente.agendamento.cancel.requested',
  agendamentoCancelRetryQueue: 'portal-cliente.agendamento.cancel.requested.retry.30s',
  agendamentoCancelDlq: 'portal-cliente.agendamento.cancel.requested.dlq',
  agendamentoCommandConsumerEnabled: false,
  retryDelayMs: 30_000,
  maxRetries: 5,
  reconnectInitialMs: 1_000,
  reconnectMaxMs: 30_000,
} as const;

export interface RabbitMqConfig {
  url?: string;
  exchange: string;
  retryExchange: string;
  deadLetterExchange: string;
  commandExchange: string;
  commandRetryExchange: string;
  commandDeadLetterExchange: string;
  diAverbadaQueue: string;
  diAverbadaRetryQueue: string;
  diAverbadaDlq: string;
  agendamentoCancelQueue: string;
  agendamentoCancelRetryQueue: string;
  agendamentoCancelDlq: string;
  agendamentoCommandConsumerEnabled: boolean;
  retryDelayMs: number;
  maxRetries: number;
}

const positiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const rabbitMqConfig = (): RabbitMqConfig => ({
  url: process.env.RABBITMQ_URL,
  exchange: process.env.RABBITMQ_EXCHANGE ?? RABBITMQ_DEFAULTS.exchange,
  retryExchange: process.env.RABBITMQ_RETRY_EXCHANGE ?? RABBITMQ_DEFAULTS.retryExchange,
  deadLetterExchange: process.env.RABBITMQ_DLX_EXCHANGE ?? RABBITMQ_DEFAULTS.deadLetterExchange,
  commandExchange: process.env.RABBITMQ_COMMAND_EXCHANGE ?? RABBITMQ_DEFAULTS.commandExchange,
  commandRetryExchange: process.env.RABBITMQ_COMMAND_RETRY_EXCHANGE ?? RABBITMQ_DEFAULTS.commandRetryExchange,
  commandDeadLetterExchange: process.env.RABBITMQ_COMMAND_DLX_EXCHANGE ?? RABBITMQ_DEFAULTS.commandDeadLetterExchange,
  diAverbadaQueue: process.env.RABBITMQ_DI_AVERBADA_QUEUE ?? RABBITMQ_DEFAULTS.diAverbadaQueue,
  diAverbadaRetryQueue: process.env.RABBITMQ_DI_AVERBADA_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.diAverbadaRetryQueue,
  diAverbadaDlq: process.env.RABBITMQ_DI_AVERBADA_DLQ ?? RABBITMQ_DEFAULTS.diAverbadaDlq,
  agendamentoCancelQueue: process.env.RABBITMQ_AGENDAMENTO_CANCEL_QUEUE ?? RABBITMQ_DEFAULTS.agendamentoCancelQueue,
  agendamentoCancelRetryQueue: process.env.RABBITMQ_AGENDAMENTO_CANCEL_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.agendamentoCancelRetryQueue,
  agendamentoCancelDlq: process.env.RABBITMQ_AGENDAMENTO_CANCEL_DLQ ?? RABBITMQ_DEFAULTS.agendamentoCancelDlq,
  agendamentoCommandConsumerEnabled: process.env.AGENDAMENTO_COMMAND_RABBITMQ_CONSUMER_ENABLED === 'true',
  retryDelayMs: positiveInt(process.env.RABBITMQ_RETRY_DELAY_MS, RABBITMQ_DEFAULTS.retryDelayMs),
  maxRetries: positiveInt(process.env.RABBITMQ_MAX_RETRIES, RABBITMQ_DEFAULTS.maxRetries),
});
