require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseGestaoAcessoCommand,
} = require('../src/rabbitmq/contracts/gestao-acesso-command.contract');

const base = {
  eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
  eventType: 'gestao-acesso.command.requested',
  version: 1,
  occurredAt: '2026-09-29T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
};

const revogar = { ...base, payload: { op: 'convite.revogar', conviteId: 'convite-123' } };
const setActive = { ...base, payload: { op: 'user.set-active', userId: 'user-123', active: false } };

test('accepts convite.revogar and exposes commandId', () => {
  const parsed = parseGestaoAcessoCommand(revogar);
  assert.equal(parsed.commandId, revogar.eventId);
  assert.equal(parsed.payload.op, 'convite.revogar');
  assert.equal(parsed.payload.conviteId, 'convite-123');
});

test('accepts user.set-active with boolean active', () => {
  const parsed = parseGestaoAcessoCommand(setActive);
  assert.equal(parsed.payload.active, false);
});

test('rejects user.set-active without active', () => {
  assert.throws(() => parseGestaoAcessoCommand({ ...base, payload: { op: 'user.set-active', userId: 'user-1' } }), /GESTAO_ACESSO_COMMAND_INVALID/);
});

test('rejects an unknown op', () => {
  assert.throws(() => parseGestaoAcessoCommand({ ...base, payload: { op: 'user.delete', userId: 'user-1' } }), /GESTAO_ACESSO_COMMAND_INVALID/);
});

test('rejects the wrong source', () => {
  assert.throws(() => parseGestaoAcessoCommand({ ...revogar, source: 'portal-cliente' }), /GESTAO_ACESSO_COMMAND_INVALID/);
});

test('rejects extra keys in payload (strict)', () => {
  assert.throws(() => parseGestaoAcessoCommand({ ...base, payload: { ...revogar.payload, extra: 'x' } }), /GESTAO_ACESSO_COMMAND_INVALID/);
});
