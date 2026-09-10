---
name: rabbitmq-outbox-worker-pattern
description: Use ao criar consumidores de fila, jobs assíncronos ou clientes HTTP resilientes num sistema com mensageria RabbitMQ e workers em background. Cobre o padrão Outbox, separação de processos e resiliência a falha.
---

# Padrão Outbox + Worker (RabbitMQ)

## Separação de processos

Tarefas pesadas (scraping, processamento em lote, sincronização massiva com sistemas externos)
nunca devem rodar dentro do processo da API HTTP principal — sempre num Worker separado,
comunicando via RabbitMQ/Outbox. Isso evita que uma tarefa pesada bloqueie o event loop que está
servindo requisições HTTP normais.

## Padrão Outbox

Persista o evento no banco de dados na MESMA transação que a operação de negócio, antes de
publicar na fila. Isso evita o cenário clássico de "commitou no banco mas a mensagem nunca saiu"
(ou vice-versa) quando o processo cai entre as duas operações. Um processo separado lê a tabela
de outbox e publica as mensagens pendentes.

## Shutdown limpo

Implemente o hook de shutdown gracioso da aplicação (ex: `onApplicationShutdown` no NestJS) para
fechar a conexão AMQP sem perder mensagens em voo. Um `SIGTERM` que mata a conexão abruptamente
pode descartar uma mensagem já consumida mas ainda não processada.

## Payloads tipados

Contratos de mensagem tipados (TypeScript + Zod, ou DTOs com validação) — nunca `any`. Uma
mensagem malformada deve falhar a deserialização de forma explícita, não silenciosamente virar
`undefined` em algum campo.

## Resiliência

- Dead-Letter Exchange (DLX) para mensagens que falham persistentemente, para não travar a fila
  principal.
- Retry com backoff exponencial, não retry imediato em loop.
- Timeout explícito e um limite máximo de tentativas em toda chamada externa feita pelo worker.

## Segredos

Credenciais de integrações externas só via variável de ambiente, nunca hardcoded — e sempre
documentadas num `.env.example` (sem os valores reais).

## Critério de aceite

- Processamento pesado não bloqueia o event loop da API principal.
- Mensagens RabbitMQ têm ACK/NACK explícito com tratamento de erro — nunca ACK automático sem
  confirmar sucesso do processamento.
- Nenhuma credencial hardcoded no código.
