-- Migration: simplify-agendamento-status
-- Remove aprovação pelo admin: PENDENTE/APROVADO/REJEITADO → ATIVO; CANCELADO mantém

-- Criar novo enum simplificado
DROP TYPE IF EXISTS "AgendamentoStatus_new";
CREATE TYPE "AgendamentoStatus_new" AS ENUM ('ATIVO', 'CANCELADO');

-- Postgres exige drop do default antes de alterar tipo da coluna
ALTER TABLE "agendamentos" ALTER COLUMN "status" DROP DEFAULT;

-- Migrar dados existentes
ALTER TABLE "agendamentos"
  ALTER COLUMN "status" TYPE "AgendamentoStatus_new"
  USING (
    CASE status::text
      WHEN 'PENDENTE'  THEN 'ATIVO'
      WHEN 'APROVADO'  THEN 'ATIVO'
      WHEN 'REJEITADO' THEN 'CANCELADO'
      WHEN 'CANCELADO' THEN 'CANCELADO'
      WHEN 'ATIVO'     THEN 'ATIVO'
      ELSE 'ATIVO'
    END
  )::"AgendamentoStatus_new";

-- Trocar default da coluna
ALTER TABLE "agendamentos" ALTER COLUMN "status" SET DEFAULT 'ATIVO'::"AgendamentoStatus_new";

-- Remover enum antigo e renomear o novo
DROP TYPE IF EXISTS "AgendamentoStatus";
ALTER TYPE "AgendamentoStatus_new" RENAME TO "AgendamentoStatus";
