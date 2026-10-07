-- Campos de devolução e correção do processo de averbação (655e766), que
-- entraram no schema sem migration.
ALTER TABLE "averbacao_processos" ADD COLUMN     "corrigido_em" TIMESTAMP(3),
ADD COLUMN     "corrigido_por" TEXT,
ADD COLUMN     "devolvido_em" TIMESTAMP(3),
ADD COLUMN     "devolvido_por" TEXT,
ADD COLUMN     "di_duimp_anterior" TEXT,
ADD COLUMN     "motivo_devolucao" TEXT;

-- O schema já declara `containerConhecimento` opcional desde a lista de
-- containers (20260916150000), mas nenhuma migration tirou o NOT NULL criado
-- em 20260910160000.
ALTER TABLE "averbacao_processos" ALTER COLUMN "container_conhecimento" DROP NOT NULL;
