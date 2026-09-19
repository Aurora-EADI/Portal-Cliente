require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseAgendamentoCancelRequested,
  parseAgendamentoCommandCompleted,
} = require('../src/rabbitmq/contracts/agendamento-command.contract');

const command = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  eventType: 'agendamento.cancel.requested',
  version: 1,
  occurredAt: '2026-09-18T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
  payload: {
    agendamentoId: '7ba7b810-9dad-41d1-80b4-00c04fd430c8',
    expectedAggregateVersion: 7,
    actor: { id: 'aurora-user-1', role: 'ADMIN' },
  },
};

test('accepts the strict cancel command contract', () => {
  const parsed = parseAgendamentoCancelRequested(command);
  assert.equal(parsed.eventId, command.eventId);
  assert.equal(parsed.payload.expectedAggregateVersion, 7);
});

test('rejects command payload secrets and invalid actor roles', () => {
  assert.throws(
    () => parseAgendamentoCancelRequested({ ...command, payload: { ...command.payload, cpf: 'secret' } }),
    /AGENDAMENTO_COMMAND_INVALID/,
  );
  assert.throws(
    () => parseAgendamentoCancelRequested({ ...command, payload: { ...command.payload, actor: { id: 'u', role: 'ADMINISTRATOR' } } }),
    /AGENDAMENTO_COMMAND_INVALID/,
  );
});

test('accepts ALREADY_SATISFIED command-completed result', () => {
  const parsed = parseAgendamentoCommandCompleted({
    eventId: '7ba7b810-9dad-41d1-80b4-00c04fd430c8',
    eventType: 'agendamento.command-completed',
    version: 1,
    occurredAt: '2026-09-18T12:00:01.000Z',
    source: 'portal-cliente',
    correlationId: command.correlationId,
    causationId: command.eventId,
    payload: {
      commandId: command.eventId,
      commandType: 'agendamento.cancel.requested',
      agendamentoId: command.payload.agendamentoId,
      outcome: 'ALREADY_SATISFIED',
      currentAggregateVersion: 7,
      currentStatus: 'CANCELADO',
    },
  });
  assert.equal(parsed.payload.outcome, 'ALREADY_SATISFIED');
});
