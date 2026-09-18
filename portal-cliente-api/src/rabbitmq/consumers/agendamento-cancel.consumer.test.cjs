require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { AgendamentoCancelConsumer } = require('./agendamento-cancel.consumer');

const command = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  eventType: 'agendamento.cancel.requested',
  version: 1,
  occurredAt: '2026-09-18T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
  payload: {
    agendamentoId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
    expectedAggregateVersion: 7,
    actor: { id: 'actor-1', role: 'ADMIN' },
  },
};

const message = (body = command, headers = {}) => ({
  content: Buffer.from(JSON.stringify(body)),
  properties: { headers },
});

function makeRabbit() {
  const calls = [];
  return {
    calls,
    topology: {
      agendamentoCommandConsumerEnabled: true,
      agendamentoCancelQueue: 'portal-cliente.agendamento.cancel.requested',
      commandRetryExchange: 'portal.integration.commands.retry',
      commandDeadLetterExchange: 'portal.integration.commands.dlx',
      commandMaxRetries: 5,
    },
    publish: async (...args) => calls.push(['publish', ...args]),
    ack: async (...args) => calls.push(['ack', ...args]),
    registerConsumer: (...args) => calls.push(['register', ...args]),
  };
}

test('valid command is acknowledged after the transactional inbox result', async () => {
  const rabbit = makeRabbit();
  const processed = [];
  const consumer = new AgendamentoCancelConsumer(rabbit, {
    process: async (event) => { processed.push(event); return { duplicate: false, kind: 'APPLIED' }; },
  });

  await consumer.handle(message());

  assert.equal(processed.length, 1);
  assert.equal(processed[0].commandId, command.eventId);
  assert.deepEqual(rabbit.calls.map(([kind]) => kind), ['ack']);
});

test('duplicate command is acknowledged without a second mutation', async () => {
  const rabbit = makeRabbit();
  let calls = 0;
  const consumer = new AgendamentoCancelConsumer(rabbit, {
    process: async () => { calls += 1; return { duplicate: true }; },
  });

  await consumer.handle(message());

  assert.equal(calls, 1);
  assert.deepEqual(rabbit.calls.map(([kind]) => kind), ['ack']);
});

test('technical failure retries on the command topology, never on events', async () => {
  const rabbit = makeRabbit();
  const consumer = new AgendamentoCancelConsumer(rabbit, {
    process: async () => { throw new Error('database unavailable'); },
  });

  await consumer.handle(message());

  assert.equal(rabbit.calls[0][0], 'publish');
  assert.equal(rabbit.calls[0][1], 'portal.integration.commands.retry');
  assert.equal(rabbit.calls[0][2], 'agendamento.cancel.requested');
  assert.equal(rabbit.calls[0][4].headers['x-retry-count'], 1);
  assert.equal(rabbit.calls[1][0], 'ack');
  assert.notEqual(rabbit.calls[0][1], 'portal.integration.events');
});

test('malformed command goes to the command DLX without a business rejection', async () => {
  const rabbit = makeRabbit();
  const consumer = new AgendamentoCancelConsumer(rabbit, { process: async () => { throw new Error('must not process'); } });

  await consumer.handle(message({ ...command, payload: { ...command.payload, actor: { id: 'actor-1', role: 'CLIENTE' } } }));

  assert.equal(rabbit.calls[0][1], 'portal.integration.commands.dlx');
  assert.equal(rabbit.calls[1][0], 'ack');
});

test('disabled consumer does not register a command queue', () => {
  const rabbit = makeRabbit();
  rabbit.topology.agendamentoCommandConsumerEnabled = false;
  const consumer = new AgendamentoCancelConsumer(rabbit, { process: async () => ({}) });

  consumer.register();

  assert.equal(rabbit.calls.length, 0);
});

test('enabled consumer registers the dedicated cancel queue', () => {
  const rabbit = makeRabbit();
  const consumer = new AgendamentoCancelConsumer(rabbit, { process: async () => ({}) });

  consumer.register();

  assert.equal(rabbit.calls[0][0], 'register');
  assert.equal(rabbit.calls[0][1], 'portal-cliente.agendamento.cancel.requested');
});
