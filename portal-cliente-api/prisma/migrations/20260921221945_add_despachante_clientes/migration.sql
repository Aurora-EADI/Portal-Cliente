-- CreateTable
CREATE TABLE "despachante_clientes" (
    "id" TEXT NOT NULL,
    "despachante_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "ultima_di_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "despachante_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "despachante_clientes_cliente_id_idx" ON "despachante_clientes"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "despachante_clientes_despachante_id_cliente_id_key" ON "despachante_clientes"("despachante_id", "cliente_id");

-- AddForeignKey
ALTER TABLE "despachante_clientes" ADD CONSTRAINT "despachante_clientes_despachante_id_fkey" FOREIGN KEY ("despachante_id") REFERENCES "despachantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despachante_clientes" ADD CONSTRAINT "despachante_clientes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
