require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseDisAverbadaCreated,
  parseAgendamentoStatusChangedV2,
  parseEvent,
  serializeEvent,
  EVENT_TYPES,
} = require('../src/rabbitmq/contracts/event-envelope');
const { OutboxService } = require('../src/rabbitmq/publishers/outbox.service');

const validEvent = {
  eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
  eventType: 'dis.averbada.created',
  version: 1,
  occurredAt: '2026-09-16T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: null,
  payload: {
    nLote: 'LOTE-2026-001',
    diId: 'aurora-di-01',
    numeroDI: '26BR000001',
    cpfMotorista: '12345678901',
    placaVeiculo: 'ABC1D23',
    dtAverbacao: '2026-09-16T12:00:00.000Z',
    idContainers: ['container-01', 'container-02'],
  },
};

const validStatusChangedV2 = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  eventType: 'agendamento.status-changed',
  version: 2,
  occurredAt: '2026-09-18T12:00:00.000Z',
  source: 'portal-cliente',
  correlationId: null,
  payload: {
    agendamentoId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
    status: 'CHEGOU',
    previousStatus: 'ATIVO',
    changedAt: '2026-09-18T12:00:00.000Z',
    aggregateVersion: 1,
  },
};

test('accepts the version 1 dis.averbada.created contract with authoritative nLote', () => {
  const event = parseDisAverbadaCreated(validEvent);
  assert.equal(event.eventType, EVENT_TYPES.DIS_AVERBADA_CREATED);
  assert.equal(event.version, 1);
  assert.equal(event.payload.nLote, 'LOTE-2026-001');
  assert.deepEqual(event.payload.idContainers, ['container-01', 'container-02']);
});

test('rejects a DI event without nLote instead of deriving a fallback identity', () => {
  const { nLote, ...payloadWithoutLot } = validEvent.payload;
  assert.throws(
    () => parseDisAverbadaCreated({ ...validEvent, payload: payloadWithoutLot }),
    /nLote/i,
  );
});

test('rejects event envelopes with a timestamp used as eventId', () => {
  assert.throws(
    () => parseDisAverbadaCreated({ ...validEvent, eventId: validEvent.occurredAt }),
    /eventId/i,
  );
});

test('dispatches existing DI v1 and status v2 by eventType plus version', () => {
  assert.deepEqual(parseEvent(validEvent), parseDisAverbadaCreated(validEvent));
  assert.deepEqual(parseEvent(validStatusChangedV2), parseAgendamentoStatusChangedV2(validStatusChangedV2));
  assert.throws(
    () => parseEvent({ ...validEvent, version: 2 }),
    /UNSUPPORTED_EVENT/i,
  );
});

test('serializes existing DI v1 without changing its version or payload', () => {
  assert.deepEqual(JSON.parse(serializeEvent(validEvent)), validEvent);
});

test('accepts only the safe v2 status payload', () => {
  assert.deepEqual(parseAgendamentoStatusChangedV2(validStatusChangedV2), validStatusChangedV2);
  for (const forbidden of ['diId', 'operadorId', 'cpf', 'placa', 'motorista', 'container']) {
    assert.throws(
      () => parseAgendamentoStatusChangedV2({
        ...validStatusChangedV2,
        payload: { ...validStatusChangedV2.payload, [forbidden]: 'secret' },
      }),
      /Unrecognized key|invalid/i,
    );
  }
});

test('serializes only v2 status fields from the transactional writer', async () => {
  let persisted;
  const tx = {
    outboxEvent: {
      create: async ({ data }) => { persisted = data; return data; },
    },
  };
  const changedAt = new Date('2026-09-18T12:34:56.000Z');
  await new OutboxService({}).createAgendamentoStatusChanged(tx, {
    agendamento: { id: validStatusChangedV2.payload.agendamentoId, status: 'CHEGOU' },
    previousStatus: 'ATIVO',
    changedAt,
    aggregateVersion: 1,
    correlationId: validStatusChangedV2.eventId,
    causationId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
  });
  assert.equal(persisted.payload.version, 2);
  assert.equal(persisted.payload.occurredAt, changedAt.toISOString());
  assert.equal(persisted.payload.payload.changedAt, changedAt.toISOString());
  assert.equal(persisted.payload.payload.aggregateVersion, 1);
  assert.deepEqual(Object.keys(persisted.payload.payload).sort(), [
    'agendamentoId', 'aggregateVersion', 'changedAt', 'previousStatus', 'status',
  ]);
});
