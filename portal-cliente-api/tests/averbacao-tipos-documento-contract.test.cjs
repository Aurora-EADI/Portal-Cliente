require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseAverbacaoTiposDocumentoReplicar,
} = require('../src/rabbitmq/contracts/averbacao-tipos-documento.contract');

const validEvent = {
  eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
  eventType: 'averbacao.tipos-documento.replicar',
  version: 1,
  occurredAt: '2026-09-29T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: null,
  payload: {
    tipos: [
      {
        auroraId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
        modalidade: 'MARITIMO',
        descricao: 'Conhecimento de embarque',
        obrigatorio: true,
        step: 1,
        ativo: true,
        ordem: 0,
      },
    ],
  },
};

test('accepts a valid tipos-documento replicar event', () => {
  const parsed = parseAverbacaoTiposDocumentoReplicar(validEvent);
  assert.equal(parsed.payload.tipos.length, 1);
  assert.equal(parsed.payload.tipos[0].auroraId, validEvent.payload.tipos[0].auroraId);
});

test('accepts an empty catalog (full deactivate)', () => {
  const parsed = parseAverbacaoTiposDocumentoReplicar({ ...validEvent, payload: { tipos: [] } });
  assert.deepEqual(parsed.payload.tipos, []);
});

test('rejects a tipo with an unknown modalidade', () => {
  assert.throws(() => parseAverbacaoTiposDocumentoReplicar({
    ...validEvent,
    payload: { tipos: [{ ...validEvent.payload.tipos[0], modalidade: 'NAO_EXISTE' }] },
  }));
});

test('rejects the wrong source', () => {
  assert.throws(() => parseAverbacaoTiposDocumentoReplicar({ ...validEvent, source: 'portal-cliente' }));
});

test('rejects extra keys in a tipo (strict)', () => {
  assert.throws(() => parseAverbacaoTiposDocumentoReplicar({
    ...validEvent,
    payload: { tipos: [{ ...validEvent.payload.tipos[0], extra: 'x' }] },
  }));
});
