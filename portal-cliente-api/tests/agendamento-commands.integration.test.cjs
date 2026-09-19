require('reflect-metadata');
require('ts-node/register');

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { connect } = require('amqplib');

const enabled = Boolean(process.env.RABBITMQ_TEST_URL && process.env.DATABASE_URL);
const timeout = 60_000;

const waitFor = async (predicate, timeoutMs = 12_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('timed out waiting for integration result');
};

const command = ({ commandId = randomUUID(), agendamentoId, expectedAggregateVersion, actorRole = 'ADMIN' }) => ({
  eventId: commandId,
  eventType: 'agendamento.cancel.requested',
  version: 1,
  source: 'portal-aurora',
  occurredAt: new Date().toISOString(),
  correlationId: randomUUID(),
  payload: {
    agendamentoId,
    expectedAggregateVersion,
    actor: { id: randomUUID(), role: actorRole },
  },
});

const publishConfirmed = async (channel, exchange, routingKey, payload) => {
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
    messageId: payload.eventId,
    correlationId: payload.correlationId,
  });
  await channel.waitForConfirms();
};

test('RabbitMQ real command path preserves mutation, no-op, rejection, redelivery and independent result outbox', { skip: !enabled, timeout }, async () => {
  process.env.RABBITMQ_URL = process.env.RABBITMQ_TEST_URL;
  process.env.AGENDAMENTO_COMMAND_RABBITMQ_CONSUMER_ENABLED = 'true';
  process.env.RABBITMQ_RETRY_DELAY_MS = '100';
  const queueSuffix = randomUUID();
  process.env.RABBITMQ_AGENDAMENTO_CANCEL_QUEUE = `test.portal-cliente.agendamento.cancel.${queueSuffix}`;
  process.env.RABBITMQ_AGENDAMENTO_CANCEL_RETRY_QUEUE = `test.portal-cliente.agendamento.cancel.${queueSuffix}.retry`;
  process.env.RABBITMQ_AGENDAMENTO_CANCEL_DLQ = `test.portal-cliente.agendamento.cancel.${queueSuffix}.dlq`;

  const { PrismaService } = require('../src/prisma/prisma.service');
  const { RabbitMqService } = require('../src/rabbitmq/rabbitmq.service');
  const { AgendamentoCancelConsumer } = require('../src/rabbitmq/consumers/agendamento-cancel.consumer');
  const { AgendamentoCommandInboxService } = require('../src/rabbitmq/consumers/agendamento-command-inbox.service');
  const { AgendamentoCommandTransactionService } = require('../src/agendamento-commands/agendamento-command-transaction.service');
  const { AgendamentoCancelService } = require('../src/agendamento-commands/agendamento-cancel.service');
  const { AgendamentoCommandRejectionService } = require('../src/agendamento-commands/agendamento-command-rejection.service');
  const { AgendamentoCommandCompletedService } = require('../src/agendamento-commands/agendamento-command-completed.service');
  const { AgendamentoStatusService } = require('../src/agendamento/agendamento-status.service');
  const { OutboxService } = require('../src/rabbitmq/publishers/outbox.service');
  const { OutboxWorker } = require('../src/rabbitmq/publishers/outbox.worker');

  const prisma = new PrismaService();
  await prisma.onModuleInit();
  await prisma.processedEvent.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.agendamentoStatusHistorico.deleteMany();
  await prisma.agendamento.deleteMany();

  const outbox = new OutboxService(prisma);
  const statusWriter = new AgendamentoStatusService(prisma, outbox);
  const completed = new AgendamentoCommandCompletedService(outbox);
  const rejectionService = new AgendamentoCommandRejectionService(outbox);
  const transaction = new AgendamentoCommandTransactionService(
    new AgendamentoCancelService(statusWriter, completed),
    rejectionService,
  );
  const rabbit = new RabbitMqService();
  const inbox = new AgendamentoCommandInboxService(prisma, transaction);
  const consumer = new AgendamentoCancelConsumer(rabbit, inbox);
  consumer.register();
  await rabbit.start();
  await waitFor(() => rabbit.isReady);

  const external = await connect(process.env.RABBITMQ_TEST_URL);
  const channel = await external.createConfirmChannel();
  const resultQueue = `test.aurora.command-results.${randomUUID()}`;
  await channel.assertQueue(resultQueue, { durable: false, autoDelete: true });
  for (const routingKey of ['agendamento.status-changed', 'agendamento.command-completed', 'agendamento.command-rejected']) {
    await channel.bindQueue(resultQueue, rabbit.topology.exchange, routingKey);
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      data: '2026-09-18',
      horario: '10:00',
      protocolo: `PHASE2-${Date.now()}-${randomUUID()}`,
      status: 'ATIVO',
      servicos: [],
    },
  });

  const first = command({ agendamentoId: agendamento.id, expectedAggregateVersion: 0 });
  await publishConfirmed(channel, rabbit.topology.commandExchange, first.eventType, first);
  await waitFor(() => prisma.processedEvent.findUnique({ where: { eventId: first.eventId } }));
  const changedOutbox = await waitFor(() => prisma.outboxEvent.findFirst({
    where: { eventType: 'agendamento.status-changed', aggregateId: agendamento.id },
    orderBy: { createdAt: 'desc' },
  }));
  assert.equal(changedOutbox.eventType, 'agendamento.status-changed');

  const changedBeforePublish = await prisma.agendamento.findUnique({ where: { id: agendamento.id } });
  assert.equal(changedBeforePublish.status, 'CANCELADO');
  assert.equal(changedBeforePublish.aggregateVersion, 1);
  assert.equal(await prisma.agendamentoStatusHistorico.count({ where: { agendamentoId: agendamento.id } }), 1);

  const worker = new OutboxWorker(prisma, rabbit);
  await worker.publishPending();
  const changedMessage = await waitFor(() => channel.get(resultQueue, { noAck: true }));
  const changed = JSON.parse(changedMessage.content.toString('utf8'));
  assert.equal(changed.eventType, 'agendamento.status-changed');
  assert.equal(changed.version, 2);
  assert.equal(changed.causationId, first.eventId);

  const noOp = command({ agendamentoId: agendamento.id, expectedAggregateVersion: 1 });
  await publishConfirmed(channel, rabbit.topology.commandExchange, noOp.eventType, noOp);
  await waitFor(() => prisma.processedEvent.findUnique({ where: { eventId: noOp.eventId } }));
  const completedOutbox = await waitFor(() => prisma.outboxEvent.findFirst({
    where: { eventType: 'agendamento.command-completed', aggregateId: agendamento.id },
    orderBy: { createdAt: 'desc' },
  }));
  assert.equal(completedOutbox.eventType, 'agendamento.command-completed');
  assert.equal((completedOutbox.payload).payload.outcome, 'ALREADY_SATISFIED');
  assert.equal(completedOutbox.status, 'PENDING');
  assert.equal(await prisma.agendamentoStatusHistorico.count({ where: { agendamentoId: agendamento.id } }), 1);
  assert.equal((await prisma.agendamento.findUnique({ where: { id: agendamento.id } })).aggregateVersion, 1);
  await worker.publishPending();
  const completedMessage = await waitFor(() => channel.get(resultQueue, { noAck: true }));
  const completedEvent = JSON.parse(completedMessage.content.toString('utf8'));
  assert.equal(completedEvent.eventType, 'agendamento.command-completed');
  assert.equal(completedEvent.causationId, noOp.eventId);

  const stale = command({ agendamentoId: agendamento.id, expectedAggregateVersion: 0 });
  await publishConfirmed(channel, rabbit.topology.commandExchange, stale.eventType, stale);
  await waitFor(() => prisma.processedEvent.findUnique({ where: { eventId: stale.eventId } }));
  const rejectionOutbox = await waitFor(() => prisma.outboxEvent.findFirst({
    where: { eventType: 'agendamento.command-rejected', aggregateId: agendamento.id },
    orderBy: { createdAt: 'desc' },
  }));
  assert.equal(rejectionOutbox.eventType, 'agendamento.command-rejected');
  assert.equal((rejectionOutbox.payload).payload.reasonCode, 'EXPECTED_AGGREGATE_VERSION_MISMATCH');
  await worker.publishPending();
  const rejectionMessage = await waitFor(() => channel.get(resultQueue, { noAck: true }));
  const rejectionEvent = JSON.parse(rejectionMessage.content.toString('utf8'));
  assert.equal(rejectionEvent.eventType, 'agendamento.command-rejected');

  for (const rejectionCase of [
    { agendamentoId: randomUUID(), expectedAggregateVersion: 0, actorRole: 'ADMIN', reasonCode: 'AGENDAMENTO_NOT_FOUND' },
    { agendamentoId: agendamento.id, expectedAggregateVersion: 1, actorRole: 'CLIENTE', reasonCode: 'ACTOR_NOT_ALLOWED' },
  ]) {
    const rejected = command(rejectionCase);
    await publishConfirmed(channel, rabbit.topology.commandExchange, rejected.eventType, rejected);
    await waitFor(() => prisma.processedEvent.findUnique({ where: { eventId: rejected.eventId } }));
    const rejectedOutbox = await waitFor(() => prisma.outboxEvent.findFirst({
      where: { eventType: 'agendamento.command-rejected' },
      orderBy: { createdAt: 'desc' },
    }));
    assert.equal(rejectedOutbox.payload.payload.reasonCode, rejectionCase.reasonCode);
    await worker.publishPending();
    const rejectedMessage = await waitFor(() => channel.get(resultQueue, { noAck: true }));
    assert.equal(JSON.parse(rejectedMessage.content.toString('utf8')).eventType, 'agendamento.command-rejected');
  }

  const outboxCountBeforeRedelivery = await prisma.outboxEvent.count();
  await publishConfirmed(channel, rabbit.topology.commandExchange, noOp.eventType, noOp);
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(await prisma.outboxEvent.count(), outboxCountBeforeRedelivery);
  assert.equal(await prisma.agendamentoStatusHistorico.count({ where: { agendamentoId: agendamento.id } }), 1);

  const pendingResult = await prisma.outboxEvent.findFirst({
    where: { eventType: 'agendamento.command-completed', aggregateId: agendamento.id },
    orderBy: { createdAt: 'desc' },
  });
  assert.equal(pendingResult.status, 'PUBLISHED');

  await channel.deleteQueue(resultQueue);
  await channel.close();
  await external.close();
  await rabbit.onModuleDestroy();
  await prisma.$disconnect();
});

after(() => {
  delete process.env.RABBITMQ_URL;
  delete process.env.AGENDAMENTO_COMMAND_RABBITMQ_CONSUMER_ENABLED;
  delete process.env.RABBITMQ_AGENDAMENTO_CANCEL_QUEUE;
  delete process.env.RABBITMQ_AGENDAMENTO_CANCEL_RETRY_QUEUE;
  delete process.env.RABBITMQ_AGENDAMENTO_CANCEL_DLQ;
});
