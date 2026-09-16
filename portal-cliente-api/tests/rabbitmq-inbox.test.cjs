require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DiAverbadaInboxService } = require('../src/rabbitmq/consumers/di-averbada-inbox.service');

const event = {
  eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
  eventType: 'dis.averbada.created', version: 1,
  occurredAt: '2026-09-16T12:00:00.000Z', source: 'portal-aurora', correlationId: null,
  payload: { nLote: 'LOTE-001', diId: 'aurora-di-1', numeroDI: '26BR000001', cpfMotorista: '12345678901', placaVeiculo: 'ABC1D23', dtAverbacao: '2026-09-16T12:00:00.000Z', idContainers: ['c-1'] },
};

test('processes an inbound event once and persists its idempotency key in the same transaction', async () => {
  const calls = [];
  const tx = {
    processedEvent: { create: async input => calls.push(['processed', input]) },
    diAverbada: { upsert: async input => calls.push(['di', input]) },
  };
  const service = new DiAverbadaInboxService({ $transaction: async fn => fn(tx) });
  assert.deepEqual(await service.process(event), { duplicate: false });
  assert.deepEqual(calls.map(([kind]) => kind), ['processed', 'di']);
  assert.equal(calls[1][1].create.auroraDiId, 'aurora-di-1');
  assert.deepEqual(calls[1][1].create.containerIds.createMany.data, [{ externalId: 'c-1' }]);
});

test('acknowledges duplicate event without applying the business effect again', async () => {
  const tx = {
    processedEvent: { create: async () => { const error = new Error('duplicate'); error.code = 'P2002'; throw error; } },
    diAverbada: { upsert: async () => { throw new Error('must not update'); } },
  };
  const service = new DiAverbadaInboxService({ $transaction: async fn => fn(tx) });
  assert.deepEqual(await service.process(event), { duplicate: true });
});
