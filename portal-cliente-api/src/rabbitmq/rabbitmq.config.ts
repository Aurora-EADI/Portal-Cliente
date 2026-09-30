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
  diDesaverbadaQueue: 'portal-cliente.dis-averbada.removed',
  diDesaverbadaRetryQueue: 'portal-cliente.dis-averbada.removed.retry.30s',
  diDesaverbadaDlq: 'portal-cliente.dis-averbada.removed.dlq',
  averbacaoTiposDocumentoQueue: 'portal-cliente.averbacao.tipos-documento.replicar',
  averbacaoTiposDocumentoRetryQueue: 'portal-cliente.averbacao.tipos-documento.replicar.retry.30s',
  averbacaoTiposDocumentoDlq: 'portal-cliente.averbacao.tipos-documento.replicar.dlq',
  agendamentoCancelQueue: 'portal-cliente.agendamento.cancel.requested',
  agendamentoCancelRetryQueue: 'portal-cliente.agendamento.cancel.requested.retry.30s',
  agendamentoCancelDlq: 'portal-cliente.agendamento.cancel.requested.dlq',
  agendamentoStatusChangeQueue: 'portal-cliente.agendamento.status.change.requested',
  agendamentoStatusChangeRetryQueue: 'portal-cliente.agendamento.status.change.requested.retry.30s',
  agendamentoStatusChangeDlq: 'portal-cliente.agendamento.status.change.requested.dlq',
  averbacaoCommandQueue: 'portal-cliente.averbacao.command.requested',
  averbacaoCommandRetryQueue: 'portal-cliente.averbacao.command.requested.retry.30s',
  averbacaoCommandDlq: 'portal-cliente.averbacao.command.requested.dlq',
  gestaoAcessoCommandQueue: 'portal-cliente.gestao-acesso.command.requested',
  gestaoAcessoCommandRetryQueue: 'portal-cliente.gestao-acesso.command.requested.retry.30s',
  gestaoAcessoCommandDlq: 'portal-cliente.gestao-acesso.command.requested.dlq',
  transportadorasQueue: 'portal-cliente.transportadoras.replicar',
  transportadorasRetryQueue: 'portal-cliente.transportadoras.replicar.retry.30s',
  transportadorasDlq: 'portal-cliente.transportadoras.replicar.dlq',
  janelaCommandQueue: 'portal-cliente.janela.command.requested',
  janelaCommandRetryQueue: 'portal-cliente.janela.command.requested.retry.30s',
  janelaCommandDlq: 'portal-cliente.janela.command.requested.dlq',
  agendamentoCommandConsumerEnabled: false,
  agendamentoStatusCommandConsumerEnabled: false,
  averbacaoCommandConsumerEnabled: false,
  gestaoAcessoCommandConsumerEnabled: false,
  janelaCommandConsumerEnabled: false,
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
  diDesaverbadaQueue: string;
  diDesaverbadaRetryQueue: string;
  diDesaverbadaDlq: string;
  averbacaoTiposDocumentoQueue: string;
  averbacaoTiposDocumentoRetryQueue: string;
  averbacaoTiposDocumentoDlq: string;
  agendamentoCancelQueue: string;
  agendamentoCancelRetryQueue: string;
  agendamentoCancelDlq: string;
  agendamentoStatusChangeQueue: string;
  agendamentoStatusChangeRetryQueue: string;
  agendamentoStatusChangeDlq: string;
  averbacaoCommandQueue: string;
  averbacaoCommandRetryQueue: string;
  averbacaoCommandDlq: string;
  gestaoAcessoCommandQueue: string;
  gestaoAcessoCommandRetryQueue: string;
  gestaoAcessoCommandDlq: string;
  transportadorasQueue: string;
  transportadorasRetryQueue: string;
  transportadorasDlq: string;
  janelaCommandQueue: string;
  janelaCommandRetryQueue: string;
  janelaCommandDlq: string;
  agendamentoCommandConsumerEnabled: boolean;
  agendamentoStatusCommandConsumerEnabled: boolean;
  averbacaoCommandConsumerEnabled: boolean;
  gestaoAcessoCommandConsumerEnabled: boolean;
  janelaCommandConsumerEnabled: boolean;
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
  diDesaverbadaQueue: process.env.RABBITMQ_DI_DESAVERBADA_QUEUE ?? RABBITMQ_DEFAULTS.diDesaverbadaQueue,
  diDesaverbadaRetryQueue: process.env.RABBITMQ_DI_DESAVERBADA_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.diDesaverbadaRetryQueue,
  diDesaverbadaDlq: process.env.RABBITMQ_DI_DESAVERBADA_DLQ ?? RABBITMQ_DEFAULTS.diDesaverbadaDlq,
  averbacaoTiposDocumentoQueue: process.env.RABBITMQ_AVERBACAO_TIPOS_DOCUMENTO_QUEUE ?? RABBITMQ_DEFAULTS.averbacaoTiposDocumentoQueue,
  averbacaoTiposDocumentoRetryQueue: process.env.RABBITMQ_AVERBACAO_TIPOS_DOCUMENTO_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.averbacaoTiposDocumentoRetryQueue,
  averbacaoTiposDocumentoDlq: process.env.RABBITMQ_AVERBACAO_TIPOS_DOCUMENTO_DLQ ?? RABBITMQ_DEFAULTS.averbacaoTiposDocumentoDlq,
  agendamentoCancelQueue: process.env.RABBITMQ_AGENDAMENTO_CANCEL_QUEUE ?? RABBITMQ_DEFAULTS.agendamentoCancelQueue,
  agendamentoCancelRetryQueue: process.env.RABBITMQ_AGENDAMENTO_CANCEL_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.agendamentoCancelRetryQueue,
  agendamentoCancelDlq: process.env.RABBITMQ_AGENDAMENTO_CANCEL_DLQ ?? RABBITMQ_DEFAULTS.agendamentoCancelDlq,
  agendamentoStatusChangeQueue: process.env.RABBITMQ_AGENDAMENTO_STATUS_CHANGE_QUEUE ?? RABBITMQ_DEFAULTS.agendamentoStatusChangeQueue,
  agendamentoStatusChangeRetryQueue: process.env.RABBITMQ_AGENDAMENTO_STATUS_CHANGE_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.agendamentoStatusChangeRetryQueue,
  agendamentoStatusChangeDlq: process.env.RABBITMQ_AGENDAMENTO_STATUS_CHANGE_DLQ ?? RABBITMQ_DEFAULTS.agendamentoStatusChangeDlq,
  averbacaoCommandQueue: process.env.RABBITMQ_AVERBACAO_COMMAND_QUEUE ?? RABBITMQ_DEFAULTS.averbacaoCommandQueue,
  averbacaoCommandRetryQueue: process.env.RABBITMQ_AVERBACAO_COMMAND_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.averbacaoCommandRetryQueue,
  averbacaoCommandDlq: process.env.RABBITMQ_AVERBACAO_COMMAND_DLQ ?? RABBITMQ_DEFAULTS.averbacaoCommandDlq,
  gestaoAcessoCommandQueue: process.env.RABBITMQ_GESTAO_ACESSO_COMMAND_QUEUE ?? RABBITMQ_DEFAULTS.gestaoAcessoCommandQueue,
  gestaoAcessoCommandRetryQueue: process.env.RABBITMQ_GESTAO_ACESSO_COMMAND_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.gestaoAcessoCommandRetryQueue,
  gestaoAcessoCommandDlq: process.env.RABBITMQ_GESTAO_ACESSO_COMMAND_DLQ ?? RABBITMQ_DEFAULTS.gestaoAcessoCommandDlq,
  transportadorasQueue: process.env.RABBITMQ_TRANSPORTADORAS_QUEUE ?? RABBITMQ_DEFAULTS.transportadorasQueue,
  transportadorasRetryQueue: process.env.RABBITMQ_TRANSPORTADORAS_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.transportadorasRetryQueue,
  transportadorasDlq: process.env.RABBITMQ_TRANSPORTADORAS_DLQ ?? RABBITMQ_DEFAULTS.transportadorasDlq,
  janelaCommandQueue: process.env.RABBITMQ_JANELA_COMMAND_QUEUE ?? RABBITMQ_DEFAULTS.janelaCommandQueue,
  janelaCommandRetryQueue: process.env.RABBITMQ_JANELA_COMMAND_RETRY_QUEUE ?? RABBITMQ_DEFAULTS.janelaCommandRetryQueue,
  janelaCommandDlq: process.env.RABBITMQ_JANELA_COMMAND_DLQ ?? RABBITMQ_DEFAULTS.janelaCommandDlq,
  agendamentoCommandConsumerEnabled: process.env.AGENDAMENTO_COMMAND_RABBITMQ_CONSUMER_ENABLED === 'true',
  agendamentoStatusCommandConsumerEnabled: process.env.AGENDAMENTO_STATUS_COMMAND_RABBITMQ_CONSUMER_ENABLED === 'true',
  averbacaoCommandConsumerEnabled: process.env.AVERBACAO_COMMAND_RABBITMQ_CONSUMER_ENABLED === 'true',
  gestaoAcessoCommandConsumerEnabled: process.env.GESTAO_ACESSO_COMMAND_RABBITMQ_CONSUMER_ENABLED === 'true',
  janelaCommandConsumerEnabled: process.env.JANELA_COMMAND_RABBITMQ_CONSUMER_ENABLED === 'true',
  retryDelayMs: positiveInt(process.env.RABBITMQ_RETRY_DELAY_MS, RABBITMQ_DEFAULTS.retryDelayMs),
  maxRetries: positiveInt(process.env.RABBITMQ_MAX_RETRIES, RABBITMQ_DEFAULTS.maxRetries),
});
