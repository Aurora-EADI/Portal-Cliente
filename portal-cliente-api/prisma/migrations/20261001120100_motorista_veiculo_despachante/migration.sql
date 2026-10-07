-- Despachante passa a ser dono dos motoristas e veículos que cadastra na tela
-- de Motoristas. Antes o cadastro ficava sem dono e aparecia para todos os
-- despachantes.
ALTER TABLE "motoristas" ADD COLUMN     "despachante_id" TEXT;

ALTER TABLE "veiculos" ADD COLUMN     "despachante_id" TEXT;

CREATE UNIQUE INDEX "motoristas_despachante_id_cpf_key" ON "motoristas"("despachante_id", "cpf");

CREATE UNIQUE INDEX "veiculos_despachante_id_placa_key" ON "veiculos"("despachante_id", "placa");

ALTER TABLE "motoristas" ADD CONSTRAINT "motoristas_despachante_id_fkey" FOREIGN KEY ("despachante_id") REFERENCES "despachantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_despachante_id_fkey" FOREIGN KEY ("despachante_id") REFERENCES "despachantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
