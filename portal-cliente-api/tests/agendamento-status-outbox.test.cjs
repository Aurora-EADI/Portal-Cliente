const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register');

const { AgendamentoStatusService } = require('../src/agendamento/agendamento-status.service');
const { AgendamentoService } = require('../src/agendamento/agendamento.service');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const migrationPath = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260918120000_add_agendamento_status_version',
  'migration.sql',
);

test('Agendamento declares a zero-default aggregate version mapped to aggregate_version', () => {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  assert.match(schema, /aggregateVersion\s+Int\s+@default\(0\)\s+@map\("aggregate_version"\)/);
});

test('status version migration is additive and defaults existing rows to zero', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(
    sql,
    /ALTER TABLE\s+"agendamentos"\s+ADD COLUMN\s+"aggregate_version"\s+INTEGER\s+NOT NULL\s+DEFAULT\s+0\s*;/i,
  );
  assert.equal((sql.match(/ALTER TABLE/gi) ?? []).length, 1);
  assert.doesNotMatch(sql, /DROP\s+TABLE|DROP\s+COLUMN|RENAME\s+COLUMN|UPDATE\s+"agendamentos"/i);
});

class FakePrisma {
  constructor() {
    this.row = {
      id: 'agendamento-1',
      diId: null,
      status: 'ATIVO',
      aggregateVersion: 0,
      criadoEm: new Date('2026-09-18T12:00:00.000Z'),
    };
    this.history = [];
    this.outbox = [];
  }

  async $transaction(callback) {
    const before = structuredClone({ row: this.row, history: this.history, outbox: this.outbox });
    const tx = {
      agendamento: {
        findUnique: async () => (this.row ? { ...this.row } : null),
        updateMany: async ({ where, data }) => {
          if (!this.row || this.row.id !== where.id || this.row.aggregateVersion !== where.aggregateVersion) {
            return { count: 0 };
          }
          this.row = {
            ...this.row,
            status: data.status,
            aggregateVersion: this.row.aggregateVersion + data.aggregateVersion.increment,
          };
          return { count: 1 };
        },
        findUniqueOrThrow: async () => ({ ...this.row }),
      },
      agendamentoStatusHistorico: {
        create: async ({ data }) => {
          this.history.push(data);
          return data;
        },
      },
      outboxEvent: {
        create: async ({ data }) => {
          this.outbox.push(data);
          return data;
        },
      },
    };
    try {
      return await callback(tx);
    } catch (error) {
      if (error.code !== 'AGGREGATE_VERSION_RETRY') {
        this.row = before.row;
        this.history = before.history;
        this.outbox = before.outbox;
      }
      throw error;
    }
  }
}

function makeWriter(fake = new FakePrisma(), outbox = {
  createAgendamentoStatusChanged: async (tx, change) => {
    await tx.outboxEvent.create({ data: change });
  },
}) {
  return { writer: new AgendamentoStatusService(fake, outbox), fake };
}

test('status writer rejects invalid status and does not mutate', async () => {
  const { writer, fake } = makeWriter();
  await assert.rejects(
    writer.changeStatus({ agendamentoId: fake.row.id, nextStatus: 'INVALID', operadorId: null, correlationId: null }),
    /Status inválido/,
  );
  assert.equal(fake.row.aggregateVersion, 0);
  assert.equal(fake.history.length, 0);
  assert.equal(fake.outbox.length, 0);
});

test('status writer treats no-op as a read without history, outbox or version increment', async () => {
  const { writer, fake } = makeWriter();
  const result = await writer.changeStatus({
    agendamentoId: fake.row.id,
    nextStatus: 'ATIVO',
    operadorId: null,
    correlationId: null,
  });
  assert.equal(result.changed, false);
  assert.equal(result.aggregateVersion, 0);
  assert.equal(result.changedAt, null);
  assert.equal(fake.history.length, 0);
  assert.equal(fake.outbox.length, 0);
});

test('status writer commits status, history and outbox with one version', async () => {
  const { writer, fake } = makeWriter();
  const result = await writer.changeStatus({
    agendamentoId: fake.row.id,
    nextStatus: 'CHEGOU',
    operadorId: 'operator-1',
    correlationId: 'correlation-1',
  });
  assert.equal(result.changed, true);
  assert.equal(result.previousStatus, 'ATIVO');
  assert.equal(result.aggregateVersion, 1);
  assert.ok(result.changedAt instanceof Date);
  assert.equal(fake.row.status, 'CHEGOU');
  assert.equal(fake.row.aggregateVersion, 1);
  assert.equal(fake.history.length, 1);
  assert.equal(fake.history[0].status, 'CHEGOU');
  assert.equal(fake.history[0].previousStatus, 'ATIVO');
  assert.equal(fake.history[0].dtAlteracao.toISOString(), result.changedAt.toISOString());
  assert.equal(fake.outbox.length, 1);
});

test('status writer rolls the status and history back when outbox persistence fails', async () => {
  const { writer, fake } = makeWriter(new FakePrisma(), {
    createAgendamentoStatusChanged: async () => { throw new Error('outbox unavailable'); },
  });
  await assert.rejects(
    writer.changeStatus({ agendamentoId: fake.row.id, nextStatus: 'CHEGOU', operadorId: null, correlationId: null }),
    /outbox unavailable/,
  );
  assert.equal(fake.row.status, 'ATIVO');
  assert.equal(fake.row.aggregateVersion, 0);
  assert.equal(fake.history.length, 0);
  assert.equal(fake.outbox.length, 0);
});

test('two concurrent status changes receive versions 1 and 2', async () => {
  const { writer, fake } = makeWriter();
  const [first, second] = await Promise.all([
    writer.changeStatus({ agendamentoId: fake.row.id, nextStatus: 'CHEGOU', operadorId: null, correlationId: null }),
    writer.changeStatus({ agendamentoId: fake.row.id, nextStatus: 'CONCLUIDO', operadorId: null, correlationId: null }),
  ]);
  assert.deepEqual([first.aggregateVersion, second.aggregateVersion].sort(), [1, 2]);
  assert.deepEqual(fake.history.map((entry) => entry.status), ['CHEGOU', 'CONCLUIDO']);
  assert.equal(fake.outbox.length, 2);
  assert.equal(fake.row.aggregateVersion, 2);
});

test('cancellation delegates to the shared writer with the authenticated operator', async () => {
  const calls = [];
  const writer = { changeStatus: async (input) => { calls.push(input); return { changed: true }; } };
  const service = new AgendamentoService({}, {}, writer);
  await service.cancelarAgendamento('agendamento-1', 'operator-1');
  assert.deepEqual(calls, [{
    agendamentoId: 'agendamento-1',
    nextStatus: 'CANCELADO',
    operadorId: 'operator-1',
    correlationId: null,
  }]);
});
