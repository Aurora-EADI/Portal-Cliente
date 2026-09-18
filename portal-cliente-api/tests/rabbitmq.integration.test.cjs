require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { connect } = require('amqplib');

const waitFor = async (predicate, timeout = 8_000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('timed out waiting for integration result');
};

test('RabbitMQ real consumes DI once and publishes a confirmed status outbox event', { skip: !process.env.RABBITMQ_TEST_URL || !process.env.DATABASE_URL, timeout: 30_000 }, async () => {
  assert.ok(process.env.RABBITMQ_TEST_URL, 'RABBITMQ_TEST_URL is required');
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required');
  process.env.RABBITMQ_URL = process.env.RABBITMQ_TEST_URL;

  const { PrismaService } = require('../src/prisma/prisma.service');
  const { RabbitMqService } = require('../src/rabbitmq/rabbitmq.service');
  const { DiAverbadaInboxService } = require('../src/rabbitmq/consumers/di-averbada-inbox.service');
  const { DiAverbadaConsumer } = require('../src/rabbitmq/consumers/di-averbada.consumer');
  const { OutboxService } = require('../src/rabbitmq/publishers/outbox.service');
  const { OutboxWorker } = require('../src/rabbitmq/publishers/outbox.worker');
  const { ServiceIntegrationService } = require('../src/service/service.service');
  const { AgendamentoStatusService } = require('../src/agendamento/agendamento-status.service');

  const prisma = new PrismaService();
  await prisma.onModuleInit();
  await prisma.diAverbadaContainer.deleteMany();
  await prisma.processedEvent.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.agendamentoStatusHistorico.deleteMany();
  await prisma.agendamento.deleteMany();
  await prisma.diAverbada.deleteMany();

  const rabbit = new RabbitMqService();
  const consumer = new DiAverbadaConsumer(rabbit, new DiAverbadaInboxService(prisma));
  consumer.register();
  await rabbit.start();
  await waitFor(() => rabbit.isReady);

  const event = {
    eventId: randomUUID(), eventType: 'dis.averbada.created', version: 1,
    occurredAt: new Date().toISOString(), source: 'portal-aurora', correlationId: null,
    payload: { nLote: `LOTE-${Date.now()}`, diId: randomUUID(), numeroDI: '26BR000001', cpfMotorista: '12345678901', placaVeiculo: 'ABC1D23', dtAverbacao: new Date().toISOString(), idContainers: ['c-1', 'c-2'] },
  };
  const external = await connect(process.env.RABBITMQ_TEST_URL);
  const externalChannel = await external.createConfirmChannel();
  externalChannel.publish(rabbit.topology.exchange, event.eventType, Buffer.from(JSON.stringify(event)), { persistent: true, contentType: 'application/json', messageId: event.eventId });
  await externalChannel.waitForConfirms();
  await waitFor(async () => prisma.processedEvent.findUnique({ where: { eventId: event.eventId } }));
  externalChannel.publish(rabbit.topology.exchange, event.eventType, Buffer.from(JSON.stringify(event)), { persistent: true, contentType: 'application/json', messageId: event.eventId });
  await externalChannel.waitForConfirms();
  await waitFor(async () => (await prisma.processedEvent.count({ where: { eventId: event.eventId } })) === 1);
  assert.equal(await prisma.diAverbada.count({ where: { nLote: event.payload.nLote } }), 1);
  assert.equal(await prisma.diAverbadaContainer.count({ where: { nLote: event.payload.nLote } }), 2);

  const agendamento = await prisma.agendamento.create({ data: { data: '2026-09-16', horario: '10:00', protocolo: `TEST-${Date.now()}`, status: 'ATIVO', servicos: [] } });
  const outbox = new OutboxService(prisma);
  const service = new ServiceIntegrationService(prisma, {}, new AgendamentoStatusService(prisma, outbox));
  await service.updateAgendamentoStatus(agendamento.id, 'CHEGOU');
  assert.equal(await prisma.outboxEvent.count({ where: { eventType: 'agendamento.status-changed' } }), 1);
  assert.equal(await prisma.agendamentoStatusHistorico.count({ where: { agendamentoId: agendamento.id, status: 'CHEGOU' } }), 1);
  const auroraQueue = `test.aurora.status.${Date.now()}`;
  await externalChannel.assertQueue(auroraQueue, { durable: false });
  await externalChannel.bindQueue(auroraQueue, rabbit.topology.exchange, 'agendamento.status-changed');
  await Promise.all([new OutboxWorker(prisma, rabbit).publishPending(), new OutboxWorker(prisma, rabbit).publishPending()]);
  const statusMessage = await waitFor(async () => externalChannel.get(auroraQueue, { noAck: true }));
  const published = JSON.parse(statusMessage.content.toString('utf8'));
  assert.equal(published.eventType, 'agendamento.status-changed');
  assert.equal(published.version, 2);
  assert.equal(published.payload.agendamentoId, agendamento.id);
  assert.equal(published.payload.aggregateVersion, 1);
  assert.equal(published.payload.changedAt, published.occurredAt);
  assert.equal('diId' in published.payload, false);
  assert.ok(await prisma.outboxEvent.findFirst({ where: { aggregateId: agendamento.id, publishedAt: { not: null } } }));

  await externalChannel.deleteQueue(auroraQueue);
  await externalChannel.close();
  await external.close();
  await rabbit.onModuleDestroy();
  await prisma.$disconnect();
});
