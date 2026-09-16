require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { OutboxWorker } = require('../src/rabbitmq/publishers/outbox.worker');

const event = { id: 'outbox-1', eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9', eventType: 'agendamento.status-changed', payload: { eventType: 'agendamento.status-changed' }, attempts: 0 };

test('marks outbox event published only after publisher confirm resolves', async () => {
  let update;
  const worker = new OutboxWorker({ outboxEvent: { updateMany: async args => { update = args; } } }, { isReady: true, topology: { exchange: 'events' }, publish: async () => undefined });
  await worker.publishOne(event, 'lease-1');
  assert.equal(update.data.status, 'PUBLISHED');
  assert.ok(update.data.publishedAt instanceof Date);
});

test('keeps failed publication pending and increments attempts', async () => {
  let update;
  const worker = new OutboxWorker({ outboxEvent: { updateMany: async args => { update = args; } } }, { isReady: true, topology: { exchange: 'events' }, publish: async () => { throw new Error('broker unavailable'); } });
  await worker.publishOne(event, 'lease-1');
  assert.equal(update.data.status, 'PENDING');
  assert.equal(update.data.attempts, 1);
  assert.equal(update.data.lastError, 'broker unavailable');
});
