-- Containers do processo de averbação.
--
-- No marítimo a carga quase sempre tem mais de um container: 62 dos 101 lotes
-- marítimos em estoque no SIAUM (16/09/2026), o maior com 16. Declarar um só
-- fazia a conferência do Aurora dizer "container confere" sem que ninguém
-- soubesse dos outros.
--
-- `container_conhecimento` continua: passa a ser o primeiro da lista, e é o que
-- listagem, busca e fila de vínculo já leem.

ALTER TABLE "averbacao_processos"
  ADD COLUMN IF NOT EXISTS "containers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill: processo antigo tem exatamente o que foi declarado na abertura.
UPDATE "averbacao_processos"
SET "containers" = ARRAY["container_conhecimento"]
WHERE cardinality("containers") = 0
  AND "container_conhecimento" <> '';
