-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgendamentoStatus" ADD VALUE 'CHEGOU';
ALTER TYPE "AgendamentoStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "AgendamentoStatus" ADD VALUE 'ON_TIME';
ALTER TYPE "AgendamentoStatus" ADD VALUE 'ATRASADO';
ALTER TYPE "AgendamentoStatus" ADD VALUE 'AG_CHEGADA';
ALTER TYPE "AgendamentoStatus" ADD VALUE 'CONCLUIDO';

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_diId_fkey";

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_motoristaId_fkey";

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_transportadoraId_fkey";

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_veiculoId_fkey";

-- AlterTable
ALTER TABLE "agendamentos" DROP COLUMN "transportadoraId",
ADD COLUMN     "awbMawb" TEXT,
ADD COLUMN     "cargaEspecial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clienteId" TEXT,
ADD COLUMN     "cnpj_cliente" TEXT,
ADD COLUMN     "cnpj_transportadora" TEXT,
ADD COLUMN     "consignatario" TEXT,
ADD COLUMN     "container" TEXT,
ADD COLUMN     "cpfMotorista" TEXT,
ADD COLUMN     "criado_por_nome" TEXT,
ADD COLUMN     "criado_por_role" TEXT,
ADD COLUMN     "diNumero" TEXT,
ADD COLUMN     "dta" TEXT,
ADD COLUMN     "email_cliente" TEXT,
ADD COLUMN     "email_transportadora" TEXT,
ADD COLUMN     "empresa" TEXT,
ADD COLUMN     "endereco_cliente" TEXT,
ADD COLUMN     "endereco_transportadora" TEXT,
ADD COLUMN     "hawb" TEXT,
ADD COLUMN     "nomeMotorista" TEXT,
ADD COLUMN     "notificarWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "numeroVoo" TEXT,
ADD COLUMN     "operacao" TEXT,
ADD COLUMN     "peso" TEXT,
ADD COLUMN     "placaVeiculo" TEXT,
ADD COLUMN     "servicos" TEXT[],
ADD COLUMN     "subOperacao" TEXT,
ADD COLUMN     "telefone_cliente" TEXT,
ADD COLUMN     "telefone_transportadora" TEXT,
ADD COLUMN     "tipoVeiculo" TEXT,
ADD COLUMN     "transportadora" TEXT,
ADD COLUMN     "transportadora_conta_id" TEXT,
ADD COLUMN     "volumes" TEXT,
ADD COLUMN     "whatsapp" TEXT,
ADD COLUMN     "whatsappNotificadoEm" TIMESTAMP(3),
ALTER COLUMN "diId" DROP NOT NULL,
ALTER COLUMN "motoristaId" DROP NOT NULL,
ALTER COLUMN "veiculoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "convites_registro" ADD COLUMN     "cnpj_transportadora" TEXT,
ADD COLUMN     "cod_transp" TEXT;

-- AlterTable
ALTER TABLE "motoristas" ADD COLUMN     "transportadora_conta_id" TEXT,
ALTER COLUMN "clienteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "transportadora_conta_id" TEXT;

-- AlterTable
ALTER TABLE "veiculos" ADD COLUMN     "transportadora_conta_id" TEXT,
ALTER COLUMN "clienteId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "transportadora_contas" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cod_transp" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transportadora_contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "di_transportadora_atribuicoes" (
    "id" TEXT NOT NULL,
    "n_lote" TEXT NOT NULL,
    "container" TEXT NOT NULL DEFAULT '',
    "transportadora_conta_id" TEXT NOT NULL,
    "atribuido_por_user_id" TEXT,
    "atribuido_por_role" TEXT,
    "atribuido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whatsapp_notificado_em" TIMESTAMP(3),

    CONSTRAINT "di_transportadora_atribuicoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transportadora_contas_cnpj_key" ON "transportadora_contas"("cnpj");

-- CreateIndex
CREATE INDEX "di_transportadora_atribuicoes_transportadora_conta_id_idx" ON "di_transportadora_atribuicoes"("transportadora_conta_id");

-- CreateIndex
CREATE UNIQUE INDEX "di_transportadora_atribuicoes_n_lote_transportadora_conta_i_key" ON "di_transportadora_atribuicoes"("n_lote", "transportadora_conta_id", "container");

-- CreateIndex
CREATE INDEX "dis_averbadas_cod_despachante_idx" ON "dis_averbadas"("cod_despachante");

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_transportadora_conta_id_cpf_key" ON "motoristas"("transportadora_conta_id", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_transportadora_conta_id_placa_key" ON "veiculos"("transportadora_conta_id", "placa");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_transportadora_conta_id_fkey" FOREIGN KEY ("transportadora_conta_id") REFERENCES "transportadora_contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motoristas" ADD CONSTRAINT "motoristas_transportadora_conta_id_fkey" FOREIGN KEY ("transportadora_conta_id") REFERENCES "transportadora_contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_transportadora_conta_id_fkey" FOREIGN KEY ("transportadora_conta_id") REFERENCES "transportadora_contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_diId_fkey" FOREIGN KEY ("diId") REFERENCES "dis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_transportadora_conta_id_fkey" FOREIGN KEY ("transportadora_conta_id") REFERENCES "transportadora_contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "di_transportadora_atribuicoes" ADD CONSTRAINT "di_transportadora_atribuicoes_n_lote_fkey" FOREIGN KEY ("n_lote") REFERENCES "dis_averbadas"("n_lote") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "di_transportadora_atribuicoes" ADD CONSTRAINT "di_transportadora_atribuicoes_transportadora_conta_id_fkey" FOREIGN KEY ("transportadora_conta_id") REFERENCES "transportadora_contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
