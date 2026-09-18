const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

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
