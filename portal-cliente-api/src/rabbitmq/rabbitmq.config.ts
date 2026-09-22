export const RABBITMQ_DEFAULTS = {
  exchange: 'portal.integration.events',
  retryExchange: 'portal.integration.retry',
  deadLetterExchange: 'portal.integration.dlx',
  diAverbadaQueue: 'portal-cliente.dis-averbada.created',
  diAverbadaRetryQueue: 'portal-cliente.dis-averbada.created.retry.30s',
  diAverbadaDlq: 'portal-cliente.dis-averbada.created.dlq',
  diDesaverbadaQueue: 'portal-cliente.dis-averbada.removed',
  diDesaverbadaRetryQueue: 'portal-cliente.dis-averbada.removed.retry.30s',
  diDesaverbadaDlq: 'portal-cliente.dis-averbada.removed.dlq',
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
  diAverbadaQueue: string;
  diAverbadaRetryQueue: string;
  diAverbadaDlq: string;
  diDesaverbadaQueue: string;
  diDesaverbadaRetryQueue: string;
  diDesaverbadaDlq: string;
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
  diAverbadaQueue: process.env.RABBITMQ_DI_AVERBADA_QUEUE ?? RABBITMQ_DEFAULTS.diAverbadaQueue,
  diAverbadaRetryQueue: process.env.RABBITMQ_DI_AVERBADA_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.diAverbadaRetryQueue,
  diAverbadaDlq: process.env.RABBITMQ_DI_AVERBADA_DLQ ?? RABBITMQ_DEFAULTS.diAverbadaDlq,
  diDesaverbadaQueue: process.env.RABBITMQ_DI_DESAVERBADA_QUEUE ?? RABBITMQ_DEFAULTS.diDesaverbadaQueue,
  diDesaverbadaRetryQueue: process.env.RABBITMQ_DI_DESAVERBADA_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.diDesaverbadaRetryQueue,
  diDesaverbadaDlq: process.env.RABBITMQ_DI_DESAVERBADA_DLQ ?? RABBITMQ_DEFAULTS.diDesaverbadaDlq,
  retryDelayMs: positiveInt(process.env.RABBITMQ_RETRY_DELAY_MS, RABBITMQ_DEFAULTS.retryDelayMs),
  maxRetries: positiveInt(process.env.RABBITMQ_MAX_RETRIES, RABBITMQ_DEFAULTS.maxRetries),
});
