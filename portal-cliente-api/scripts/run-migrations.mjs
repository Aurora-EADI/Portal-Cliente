import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Conectando ao banco...');

  // Verificar estado atual
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agendamentos'
    ORDER BY ordinal_position
  `;
  console.log('Colunas de agendamentos:', cols.map(r => r.column_name).join(', '));

  const hasPwd = await prisma.$queryRaw`
    SELECT 1 as exists FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password'
  `;
  console.log('users.password existe:', hasPwd.length > 0);

  const hasTokens = await prisma.$queryRaw`
    SELECT 1 as exists FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_tokens'
  `;
  console.log('user_tokens existe:', hasTokens.length > 0);

  // Migration 1: remover password e user_tokens
  console.log('\n--- Migration 1: remove password + user_tokens ---');
  if (hasTokens.length > 0) {
    await prisma.$executeRaw`DROP TABLE IF EXISTS "user_tokens"`;
    console.log('✓ user_tokens removida');
  } else {
    console.log('  user_tokens já não existe, pulando');
  }

  if (hasPwd.length > 0) {
    await prisma.$executeRaw`ALTER TABLE "users" DROP COLUMN IF EXISTS "password"`;
    console.log('✓ users.password removida');
  } else {
    console.log('  users.password já não existe, pulando');
  }

  // Migration 2: AgendamentoStatus enum
  console.log('\n--- Migration 2: agendamento status enum ---');

  const hasEnum = await prisma.$queryRaw`
    SELECT 1 as exists FROM pg_type WHERE typname = 'AgendamentoStatus'
  `;

  if (hasEnum.length === 0) {
    await prisma.$executeRaw`CREATE TYPE "AgendamentoStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO')`;
    console.log('✓ enum AgendamentoStatus criado');
  } else {
    console.log('  enum AgendamentoStatus já existe');
  }

  const hasStatus = await prisma.$queryRaw`
    SELECT 1 as exists FROM information_schema.columns
    WHERE table_name = 'agendamentos' AND column_name = 'status'
  `;

  if (hasStatus.length === 0) {
    await prisma.$executeRaw`ALTER TABLE "agendamentos" ADD COLUMN "status" "AgendamentoStatus" NOT NULL DEFAULT 'PENDENTE'`;
    console.log('✓ agendamentos.status adicionado');
  } else {
    console.log('  agendamentos.status já existe');
  }

  const hasObs = await prisma.$queryRaw`
    SELECT 1 as exists FROM information_schema.columns
    WHERE table_name = 'agendamentos' AND column_name = 'observacao'
  `;

  if (hasObs.length === 0) {
    await prisma.$executeRaw`ALTER TABLE "agendamentos" ADD COLUMN "observacao" TEXT`;
    console.log('✓ agendamentos.observacao adicionado');
  } else {
    console.log('  agendamentos.observacao já existe');
  }

  const hasCancelado = await prisma.$queryRaw`
    SELECT 1 as exists FROM information_schema.columns
    WHERE table_name = 'agendamentos' AND column_name = 'cancelado'
  `;

  if (hasCancelado.length > 0) {
    await prisma.$executeRaw`UPDATE "agendamentos" SET "status" = 'CANCELADO' WHERE "cancelado" = true`;
    await prisma.$executeRaw`ALTER TABLE "agendamentos" DROP COLUMN "cancelado"`;
    console.log('✓ cancelado migrado para CANCELADO e coluna removida');
  } else {
    console.log('  agendamentos.cancelado já não existe');
  }

  // Verificação final
  const finalCols = await prisma.$queryRaw`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agendamentos'
    ORDER BY ordinal_position
  `;
  console.log('\nColunas finais de agendamentos:');
  finalCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  const enumVals = await prisma.$queryRaw`
    SELECT enumlabel FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AgendamentoStatus'
    ORDER BY enumsortorder
  `;
  console.log('Valores do enum:', enumVals.map(r => r.enumlabel).join(', '));

  console.log('\n✅ Todas as migrations aplicadas com sucesso!');
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
