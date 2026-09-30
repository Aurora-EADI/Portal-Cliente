require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseAverbacaoCommand,
} = require('../src/rabbitmq/contracts/averbacao-command.contract');

const base = {
  eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
  eventType: 'averbacao.command.requested',
  version: 1,
  occurredAt: '2026-09-29T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
};

const aprovar = { ...base, payload: { op: 'documento.aprovar', documentoId: 'a3bb189e-8bf9-3888-9912-ace4e6543002', analisadoPor: 'Ana' } };
const rejeitar = { ...base, payload: { op: 'documento.rejeitar', documentoId: 'a3bb189e-8bf9-3888-9912-ace4e6543002', analisadoPor: 'Ana', motivo: 'Ilegível' } };

test('accepts documento.aprovar and exposes commandId', () => {
  const parsed = parseAverbacaoCommand(aprovar);
  assert.equal(parsed.commandId, aprovar.eventId);
  assert.equal(parsed.payload.op, 'documento.aprovar');
});

test('accepts documento.rejeitar with motivo', () => {
  const parsed = parseAverbacaoCommand(rejeitar);
  assert.equal(parsed.payload.motivo, 'Ilegível');
});

test('rejects documento.rejeitar without motivo', () => {
  const semMotivo = { ...base, payload: { op: 'documento.rejeitar', documentoId: aprovar.payload.documentoId, analisadoPor: 'Ana' } };
  assert.throws(() => parseAverbacaoCommand(semMotivo), /AVERBACAO_COMMAND_INVALID/);
});

test('rejects an unknown op', () => {
  assert.throws(() => parseAverbacaoCommand({ ...base, payload: { op: 'documento.arquivar', documentoId: aprovar.payload.documentoId, analisadoPor: 'Ana' } }), /AVERBACAO_COMMAND_INVALID/);
});

test('rejects the wrong source', () => {
  assert.throws(() => parseAverbacaoCommand({ ...aprovar, source: 'portal-cliente' }), /AVERBACAO_COMMAND_INVALID/);
});

test('rejects extra keys in payload (strict)', () => {
  assert.throws(() => parseAverbacaoCommand({ ...base, payload: { ...aprovar.payload, extra: 'x' } }), /AVERBACAO_COMMAND_INVALID/);
});
