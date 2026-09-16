require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseDisAverbadaCreated,
  EVENT_TYPES,
} = require('../src/rabbitmq/contracts/event-envelope');

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
