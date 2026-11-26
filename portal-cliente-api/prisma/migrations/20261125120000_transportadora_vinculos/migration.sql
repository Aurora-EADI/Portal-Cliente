-- CreateTable
CREATE TABLE "transportadora_vinculos" (
    "id" TEXT NOT NULL,
    "transportadora_conta_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "despachante_id" TEXT,
    "criado_por_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transportadora_vinculos_pkey" PRIMARY KEY ("id"),
    -- Exatamente um dono por vínculo: cliente OU despachante.
    CONSTRAINT "transportadora_vinculos_um_dono_chk" CHECK (("cliente_id" IS NULL) <> ("despachante_id" IS NULL))
);

-- CreateIndex
CREATE INDEX "transportadora_vinculos_transportadora_conta_id_idx" ON "transportadora_vinculos"("transportadora_conta_id");

-- CreateIndex
CREATE UNIQUE INDEX "transportadora_vinculos_cliente_id_transportadora_conta_id_key" ON "transportadora_vinculos"("cliente_id", "transportadora_conta_id");

-- CreateIndex
CREATE UNIQUE INDEX "transportadora_vinculos_despachante_id_transportadora_conta_key" ON "transportadora_vinculos"("despachante_id", "transportadora_conta_id");

-- AddForeignKey
ALTER TABLE "transportadora_vinculos" ADD CONSTRAINT "transportadora_vinculos_transportadora_conta_id_fkey" FOREIGN KEY ("transportadora_conta_id") REFERENCES "transportadora_contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportadora_vinculos" ADD CONSTRAINT "transportadora_vinculos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportadora_vinculos" ADD CONSTRAINT "transportadora_vinculos_despachante_id_fkey" FOREIGN KEY ("despachante_id") REFERENCES "despachantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: quem já atribuiu uma transportadora continua vendo-a no seletor.
-- O dono vem do usuário que fez a atribuição (cliente ou despachante dele).
INSERT INTO "transportadora_vinculos" ("id", "transportadora_conta_id", "cliente_id", "criado_por_user_id")
SELECT gen_random_uuid()::text, x.transportadora_conta_id, x.cliente_id, x.user_id
FROM (
    SELECT DISTINCT ON (a."transportadora_conta_id", u."clienteId")
           a."transportadora_conta_id", u."clienteId" AS cliente_id, u."id" AS user_id
    FROM "di_transportadora_atribuicoes" a
    JOIN "users" u ON u."id" = a."atribuido_por_user_id"
    WHERE u."role" = 'CLIENTE' AND u."clienteId" IS NOT NULL
    ORDER BY a."transportadora_conta_id", u."clienteId", a."atribuido_em"
) x
ON CONFLICT DO NOTHING;

INSERT INTO "transportadora_vinculos" ("id", "transportadora_conta_id", "despachante_id", "criado_por_user_id")
SELECT gen_random_uuid()::text, x.transportadora_conta_id, x.despachante_id, x.user_id
FROM (
    SELECT DISTINCT ON (a."transportadora_conta_id", u."despachanteId")
           a."transportadora_conta_id", u."despachanteId" AS despachante_id, u."id" AS user_id
    FROM "di_transportadora_atribuicoes" a
    JOIN "users" u ON u."id" = a."atribuido_por_user_id"
    WHERE u."role" = 'DESPACHANTE' AND u."despachanteId" IS NOT NULL
    ORDER BY a."transportadora_conta_id", u."despachanteId", a."atribuido_em"
) x
ON CONFLICT DO NOTHING;
