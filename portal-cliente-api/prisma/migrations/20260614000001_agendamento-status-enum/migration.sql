-- Migration: agendamento-status-enum
-- Substitui campo cancelado (boolean) pelo enum AgendamentoStatus

-- Criar enum
CREATE TYPE "AgendamentoStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO');

-- Adicionar coluna status com default PENDENTE
ALTER TABLE "agendamentos" ADD COLUMN "status" "AgendamentoStatus" NOT NULL DEFAULT 'PENDENTE';

-- Adicionar coluna observacao
ALTER TABLE "agendamentos" ADD COLUMN "observacao" TEXT;

-- Migrar dados: cancelado=true → CANCELADO, cancelado=false → PENDENTE
UPDATE "agendamentos" SET "status" = 'CANCELADO' WHERE "cancelado" = true;

-- Remover coluna antiga
ALTER TABLE "agendamentos" DROP COLUMN IF EXISTS "cancelado";
