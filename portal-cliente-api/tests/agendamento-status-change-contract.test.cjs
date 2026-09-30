require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseAgendamentoStatusChangeRequested,
} = require('../src/rabbitmq/contracts/agendamento-command.contract');

const validCommand = {
  eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
  eventType: 'agendamento.status.change.requested',
  version: 1,
  occurredAt: '2026-09-29T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
  payload: {
    agendamentoId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
    nextStatus: 'CHEGOU',
    expectedAggregateVersion: 2,
    actor: { id: 'op-1', role: 'EMPLOYEE' },
  },
};

test('accepts a valid status change command and exposes commandId from eventId', () => {
  const parsed = parseAgendamentoStatusChangeRequested(validCommand);
  assert.equal(parsed.commandId, validCommand.eventId);
  assert.equal(parsed.payload.nextStatus, 'CHEGOU');
  assert.equal(parsed.eventType, 'agendamento.status.change.requested');
});

test('rejects an unknown nextStatus', () => {
  assert.throws(
    () => parseAgendamentoStatusChangeRequested({
      ...validCommand,
      payload: { ...validCommand.payload, nextStatus: 'NAO_EXISTE' },
    }),
    /AGENDAMENTO_COMMAND_INVALID/,
  );
});

test('rejects the wrong source', () => {
  assert.throws(
    () => parseAgendamentoStatusChangeRequested({ ...validCommand, source: 'portal-cliente' }),
    /AGENDAMENTO_COMMAND_INVALID/,
  );
});

test('rejects extra keys in payload (strict envelope)', () => {
  assert.throws(
    () => parseAgendamentoStatusChangeRequested({
      ...validCommand,
      payload: { ...validCommand.payload, extra: 'x' },
    }),
    /AGENDAMENTO_COMMAND_INVALID/,
  );
});
