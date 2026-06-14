const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Client } = require(path.join(__dirname, '../node_modules/pg'));

const SQL_MIGRATION_1 = `
-- Remove tabela de refresh tokens
DROP TABLE IF EXISTS "user_tokens";
-- Remove coluna de senha da tabela de usuários
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";
`;

const SQL_MIGRATION_2 = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgendamentoStatus') THEN
    CREATE TYPE "AgendamentoStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO');
  END IF;
END $$;

ALTER TABLE "agendamentos" ADD COLUMN IF NOT EXISTS "status" "AgendamentoStatus" NOT NULL DEFAULT 'PENDENTE';
ALTER TABLE "agendamentos" ADD COLUMN IF NOT EXISTS "observacao" TEXT;

UPDATE "agendamentos" SET "status" = 'CANCELADO' WHERE "cancelado" = true;

ALTER TABLE "agendamentos" DROP COLUMN IF EXISTS "cancelado";
`;

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✓ Conectado ao banco', process.env.DATABASE_URL.replace(/:[^@]+@/, ':***@'));

    // Check current state
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agendamentos'
      ORDER BY ordinal_position
    `);
    console.log('Colunas de agendamentos:', cols.rows.map(r => r.column_name).join(', '));

    const hasPwd = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'password'
    `);
    console.log('users.password existe:', hasPwd.rows.length > 0);

    const hasTokens = await client.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'user_tokens'
    `);
    console.log('user_tokens existe:', hasTokens.rows.length > 0);

    // Run migration 1
    console.log('\n--- Migration 1: remove password + user_tokens ---');
    await client.query(SQL_MIGRATION_1);
    console.log('✓ Migration 1 aplicada');

    // Run migration 2
    console.log('\n--- Migration 2: agendamento status enum ---');
    await client.query(SQL_MIGRATION_2);
    console.log('✓ Migration 2 aplicada');

    // Verify
    const cols2 = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agendamentos'
      ORDER BY ordinal_position
    `);
    console.log('\nColunas finais de agendamentos:');
    cols2.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    const enumVals = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'AgendamentoStatus'
    `);
    console.log('Valores do enum AgendamentoStatus:', enumVals.rows.map(r => r.enumlabel).join(', '));

    console.log('\n✅ Todas as migrations aplicadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
