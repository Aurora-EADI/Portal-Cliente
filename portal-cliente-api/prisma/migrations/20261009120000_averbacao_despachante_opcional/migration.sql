-- Averbação aberta pelo próprio CLIENTE não tem despachante: o processo vai
-- direto para a equipe Aurora. O despachante deixa de ser obrigatório; quando
-- nulo, o dono do processo é só o cliente (`cliente_id`).
ALTER TABLE "averbacao_processos" ALTER COLUMN "despachante_id" DROP NOT NULL;
