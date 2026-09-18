require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { AgendamentoStatusService } = require('../src/agendamento/agendamento-status.service');
const { OutboxService } = require('../src/rabbitmq/publishers/outbox.service');
const { AgendamentoCancelService } = require('../src/agendamento-commands/agendamento-cancel.service');
const { AgendamentoCommandCompletedService } = require('../src/agendamento-commands/agendamento-command-completed.service');
const { AgendamentoCommandRejectionService } = require('../src/agendamento-commands/agendamento-command-rejection.service');
const { AgendamentoCommandTransactionService } = require('../src/agendamento-commands/agendamento-command-transaction.service');

const AGENDAMENTO_ID = '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9';
const COMMAND_ID = '550e8400-e29b-41d4-a716-446655440000';
const CORRELATION_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

function makeTx({ status = 'ATIVO', aggregateVersion = 7, exists = true } = {}) {
  const row = exists ? {
    id: AGENDAMENTO_ID,
    status,
    aggregateVersion,
    motorista: null,
    veiculo: null,
    cliente: null,
  } : null;
  const history = [];
  const outbox = [];
  return {
    row,
    history,
    outbox,
    agendamento: {
      findUnique: async () => row && { ...row },
      updateMany: async ({ where, data }) => {
        if (!row || where.id !== row.id || where.aggregateVersion !== row.aggregateVersion) return { count: 0 };
        row.status = data.status;
        row.aggregateVersion += data.aggregateVersion.increment;
        return { count: 1 };
      },
    },
    agendamentoStatusHistorico: {
      create: async ({ data }) => { history.push(data); return data; },
    },
    outboxEvent: {
      create: async ({ data }) => { outbox.push(data); return data; },
    },
  };
}

function makeService(tx) {
  const outbox = new OutboxService({});
  const writer = new AgendamentoStatusService({}, outbox);
  const completed = new AgendamentoCommandCompletedService(outbox);
  const rejection = new AgendamentoCommandRejectionService(outbox);
  const intent = new AgendamentoCancelService(writer, completed);
  const transaction = new AgendamentoCommandTransactionService(intent, rejection);
  return { transaction, tx };
}

function command(overrides = {}) {
  return {
    commandId: COMMAND_ID,
    commandType: 'agendamento.cancel.requested',
    correlationId: CORRELATION_ID,
    agendamentoId: AGENDAMENTO_ID,
    expectedAggregateVersion: 7,
    actor: { id: 'actor-1', role: 'ADMIN' },
    ...overrides,
  };
}

test('cancel already satisfied creates one completed outbox and no status mutation', async () => {
  const { tx, transaction } = makeService(makeTx({ status: 'CANCELADO' }));

  const result = await transaction.execute(tx, command());

  assert.equal(result.kind, 'ALREADY_SATISFIED');
  assert.equal(result.aggregateVersion, 7);
  assert.equal(tx.history.length, 0);
  assert.equal(tx.tx?.row, undefined);
  assert.equal(tx.row.status, 'CANCELADO');
  assert.equal(tx.row.aggregateVersion, 7);
  assert.equal(tx.outbox.length, 1);
  assert.equal(tx.outbox[0].eventType, 'agendamento.command-completed');
  assert.equal(tx.outbox[0].payload.payload.outcome, 'ALREADY_SATISFIED');
  assert.equal(tx.outbox[0].payload.payload.currentAggregateVersion, 7);
  assert.equal(tx.outbox[0].payload.causationId, COMMAND_ID);
  assert.equal(tx.outbox[0].payload.correlationId, CORRELATION_ID);
});

test('cancel with a new status uses the shared writer exactly once', async () => {
  const { tx, transaction } = makeService(makeTx({ status: 'ATIVO' }));

  const result = await transaction.execute(tx, command());

  assert.equal(result.kind, 'APPLIED');
  assert.equal(tx.row.status, 'CANCELADO');
  assert.equal(tx.row.aggregateVersion, 8);
  assert.equal(tx.history.length, 1);
  assert.equal(tx.outbox.length, 1);
  assert.equal(tx.outbox[0].eventType, 'agendamento.status-changed');
  assert.equal(tx.outbox[0].payload.causationId, COMMAND_ID);
});

test('missing aggregate creates a business rejection without status effects', async () => {
  const { tx, transaction } = makeService(makeTx({ exists: false }));

  const result = await transaction.execute(tx, command());

  assert.equal(result.kind, 'REJECTED');
  assert.equal(result.reasonCode, 'AGENDAMENTO_NOT_FOUND');
  assert.equal(tx.history.length, 0);
  assert.equal(tx.outbox.length, 1);
  assert.equal(tx.outbox[0].eventType, 'agendamento.command-rejected');
  assert.equal(tx.outbox[0].payload.payload.reasonCode, 'AGENDAMENTO_NOT_FOUND');
});

test('stale expected version creates a strict business rejection', async () => {
  const { tx, transaction } = makeService(makeTx({ aggregateVersion: 8 }));

  const result = await transaction.execute(tx, command({ expectedAggregateVersion: 7 }));

  assert.equal(result.kind, 'REJECTED');
  assert.equal(result.reasonCode, 'EXPECTED_AGGREGATE_VERSION_MISMATCH');
  assert.equal(result.currentAggregateVersion, 8);
  assert.equal(tx.row.status, 'ATIVO');
  assert.equal(tx.row.aggregateVersion, 8);
  assert.equal(tx.history.length, 0);
  assert.equal(tx.outbox.length, 1);
});

test('actor outside the command policy is rejected without invoking the writer', async () => {
  const { tx, transaction } = makeService(makeTx());

  const result = await transaction.execute(tx, command({ actor: { id: 'actor-1', role: 'CLIENTE' } }));

  assert.equal(result.kind, 'REJECTED');
  assert.equal(result.reasonCode, 'ACTOR_NOT_ALLOWED');
  assert.equal(tx.row.status, 'ATIVO');
  assert.equal(tx.history.length, 0);
  assert.equal(tx.outbox.length, 1);
});
