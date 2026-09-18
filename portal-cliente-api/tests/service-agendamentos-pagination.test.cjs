require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ServiceIntegrationService } = require('../src/service/service.service');
const { ListAgendamentosDto } = require('../src/service/dto/list-agendamentos.dto');

function row(id, criadoEm, aggregateVersion = 0) {
  return { id, criadoEm: new Date(criadoEm), aggregateVersion, status: 'ATIVO' };
}

function makeService(rows) {
  const calls = [];
  const prisma = {
    agendamento: {
      findMany: async (args) => {
        calls.push(args);
        return rows;
      },
    },
  };
  return { service: new ServiceIntegrationService(prisma, {}, {}), calls };
}

test('bootstrap DTO accepts the documented cursor and 200-row limit', () => {
  const dto = Object.assign(new ListAgendamentosDto(), {
    bootstrapCursorCreatedEm: '2026-09-18T12:00:00.000Z',
    bootstrapCursorId: 'agendamento-200',
    bootstrapLimit: 200,
  });
  assert.equal(dto.bootstrapLimit, 200);
});

test('bootstrap returns next cursor after a lexicographically ordered page', async () => {
  const firstPage = Array.from({ length: 201 }, (_, index) => row(
    `agendamento-${String(index + 1).padStart(3, '0')}`,
    new Date(Date.parse('2026-09-18T12:00:00.000Z') + index * 60_000).toISOString(),
    index,
  ));
  const { service, calls } = makeService(firstPage);
  const result = await service.listAgendamentos({ bootstrapLimit: 200 });
  assert.equal(result.data.length, 200);
  assert.deepEqual(result.nextCursor, {
    criadoEm: firstPage[199].criadoEm.toISOString(),
    id: firstPage[199].id,
  });
  assert.equal(result.data[0].aggregateVersion, 0);
  assert.deepEqual(calls[0].orderBy, [{ criadoEm: 'asc' }, { id: 'asc' }]);
  assert.equal(calls[0].take, 201);
});

test('bootstrap cursor is traversable and empty pages terminate', async () => {
  const { service, calls } = makeService([]);
  const result = await service.listAgendamentos({
    bootstrapCursorCreatedEm: '2026-09-18T12:00:00.000Z',
    bootstrapCursorId: 'agendamento-200',
    bootstrapLimit: 200,
  });
  assert.deepEqual(result, { data: [], total: 0, timestamp: result.timestamp, nextCursor: null });
  assert.deepEqual(calls[0].where.OR, [
    { criadoEm: { gt: new Date('2026-09-18T12:00:00.000Z') } },
    { criadoEm: new Date('2026-09-18T12:00:00.000Z'), id: { gt: 'agendamento-200' } },
  ]);
});

test('legacy calls retain the current descending 500-row response shape', async () => {
  const rows = [row('legacy-1', '2026-09-18T12:00:00.000Z')];
  const { service, calls } = makeService(rows);
  const result = await service.listAgendamentos({ status: 'ATIVO' });
  assert.deepEqual(result.data, rows);
  assert.equal(result.total, 1);
  assert.equal(typeof result.timestamp, 'string');
  assert.equal('nextCursor' in result, false);
  assert.equal(calls[0].orderBy.criadoEm, 'desc');
  assert.equal(calls[0].take, 500);
});
