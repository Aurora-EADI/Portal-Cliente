-- Add the cancellation state and audit fields without changing existing rows,
-- relations, indexes, or constraints.

-- AlterEnum
ALTER TYPE "AverbacaoProcessoStatus" ADD VALUE 'CANCELADO';

-- AlterTable
ALTER TABLE "averbacao_processos"
    ADD COLUMN "cancelado_em" TIMESTAMP(3),
    ADD COLUMN "motivo_cancelamento" TEXT;
