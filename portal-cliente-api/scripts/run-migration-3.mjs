import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando estado do enum...');

  const enumVals = await prisma.$queryRaw`
    SELECT enumlabel FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AgendamentoStatus'
    ORDER BY enumsortorder
  `;
  console.log('Enum atual:', enumVals.map(r => r.enumlabel).join(', '));

  const hasAtivo = enumVals.some(r => r.enumlabel === 'ATIVO');
  if (hasAtivo) {
    console.log('✓ Enum já simplificado, nada a fazer.');
    return;
  }

  console.log('\n--- Migration 3: simplificar AgendamentoStatus → ATIVO | CANCELADO ---');

  // Drop leftover from partial previous run if exists
  await prisma.$executeRaw`DROP TYPE IF EXISTS "AgendamentoStatus_new"`;
  await prisma.$executeRaw`CREATE TYPE "AgendamentoStatus_new" AS ENUM ('ATIVO', 'CANCELADO')`;

  // Drop default before altering column type (Postgres requires this)
  await prisma.$executeRaw`ALTER TABLE "agendamentos" ALTER COLUMN "status" DROP DEFAULT`;

  await prisma.$executeRaw`
    ALTER TABLE "agendamentos"
      ALTER COLUMN "status" TYPE "AgendamentoStatus_new"
      USING (
        CASE status::text
          WHEN 'PENDENTE'  THEN 'ATIVO'
          WHEN 'APROVADO'  THEN 'ATIVO'
          WHEN 'REJEITADO' THEN 'CANCELADO'
          WHEN 'CANCELADO' THEN 'CANCELADO'
          ELSE 'ATIVO'
        END
      )::"AgendamentoStatus_new"
  `;

  await prisma.$executeRaw`ALTER TABLE "agendamentos" ALTER COLUMN "status" SET DEFAULT 'ATIVO'::"AgendamentoStatus_new"`;

  await prisma.$executeRaw`DROP TYPE "AgendamentoStatus"`;
  await prisma.$executeRaw`ALTER TYPE "AgendamentoStatus_new" RENAME TO "AgendamentoStatus"`;

  // Registrar migration
  await prisma.$executeRaw`
    INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
    VALUES (gen_random_uuid()::text, 'baseline', now(), '20260614000002_simplify-agendamento-status', 1)
    ON CONFLICT DO NOTHING
  `;

  const finalVals = await prisma.$queryRaw`
    SELECT enumlabel FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AgendamentoStatus'
    ORDER BY enumsortorder
  `;
  console.log('Enum final:', finalVals.map(r => r.enumlabel).join(', '));
  console.log('\n✅ Migration 3 aplicada com sucesso!');
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
