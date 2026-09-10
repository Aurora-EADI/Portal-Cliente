-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('MARITIMO', 'AEREO', 'RODOVIARIO');

-- CreateEnum
CREATE TYPE "ProcuracaoStatus" AS ENUM ('PENDENTE_ENVIO', 'EM_ANALISE', 'APROVADA', 'REPROVADA', 'REVOGADA');

-- CreateEnum
CREATE TYPE "ProcuracaoHistoricoAcao" AS ENUM ('ENVIO', 'APROVACAO', 'REJEICAO', 'REVOGACAO');

-- CreateEnum
CREATE TYPE "AverbacaoProcessoStatus" AS ENUM ('RASCUNHO', 'EM_ANALISE', 'PENDENTE_CORRECAO', 'LIBERADO_AGENDAMENTO');

-- CreateEnum
CREATE TYPE "AverbacaoDocumentoStatus" AS ENUM ('NAO_ENVIADO', 'EM_ANALISE', 'VALIDADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "AverbacaoHistoricoAcao" AS ENUM ('ENVIO', 'APROVACAO', 'REJEICAO', 'SUBSTITUICAO');

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" TEXT NOT NULL,
    "aurora_id" TEXT NOT NULL,
    "modalidade" "Modalidade" NOT NULL,
    "descricao" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "step" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "sincronizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procuracoes" (
    "id" TEXT NOT NULL,
    "despachante_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "status" "ProcuracaoStatus" NOT NULL DEFAULT 'PENDENTE_ENVIO',
    "arquivo_key" TEXT,
    "arquivo_nome" TEXT,
    "arquivo_tamanho" INTEGER,
    "arquivo_mime" TEXT,
    "validade" DATE,
    "motivo_recusa" TEXT,
    "analisado_por" TEXT,
    "analisado_em" TIMESTAMP(3),
    "enviado_por_user_id" TEXT,
    "enviado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procuracao_historico" (
    "id" TEXT NOT NULL,
    "procuracao_id" TEXT NOT NULL,
    "acao" "ProcuracaoHistoricoAcao" NOT NULL,
    "autor_nome" TEXT NOT NULL,
    "autor_user_id" TEXT,
    "motivo" TEXT,
    "arquivo_key" TEXT,
    "arquivo_nome" TEXT,
    "arquivo_tamanho" INTEGER,
    "validade" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procuracao_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "averbacao_processos" (
    "id" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "despachante_id" TEXT NOT NULL,
    "modalidade" "Modalidade" NOT NULL,
    "di_duimp" TEXT NOT NULL,
    "container_conhecimento" TEXT NOT NULL,
    "local_origem" TEXT,
    "recinto_destino" TEXT,
    "carga_especial" BOOLEAN NOT NULL DEFAULT false,
    "status" "AverbacaoProcessoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "n_lote" TEXT,
    "criado_por_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "averbacao_processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "averbacao_documentos" (
    "id" TEXT NOT NULL,
    "processo_id" TEXT NOT NULL,
    "tipo_documento_id" TEXT NOT NULL,
    "status" "AverbacaoDocumentoStatus" NOT NULL DEFAULT 'NAO_ENVIADO',
    "arquivo_key" TEXT,
    "arquivo_nome" TEXT,
    "arquivo_tamanho" INTEGER,
    "arquivo_mime" TEXT,
    "motivo_rejeicao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "averbacao_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "averbacao_historico" (
    "id" TEXT NOT NULL,
    "documento_id" TEXT NOT NULL,
    "acao" "AverbacaoHistoricoAcao" NOT NULL,
    "autor_nome" TEXT NOT NULL,
    "autor_user_id" TEXT,
    "motivo" TEXT,
    "arquivo_key" TEXT,
    "arquivo_nome" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "averbacao_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_aurora_id_key" ON "tipos_documento"("aurora_id");

-- CreateIndex
CREATE INDEX "tipos_documento_modalidade_step_idx" ON "tipos_documento"("modalidade", "step");

-- CreateIndex
CREATE INDEX "procuracoes_status_idx" ON "procuracoes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "procuracoes_despachante_id_cliente_id_key" ON "procuracoes"("despachante_id", "cliente_id");

-- CreateIndex
CREATE INDEX "procuracao_historico_procuracao_id_criado_em_idx" ON "procuracao_historico"("procuracao_id", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "averbacao_processos_protocolo_key" ON "averbacao_processos"("protocolo");

-- CreateIndex
CREATE INDEX "averbacao_processos_di_duimp_idx" ON "averbacao_processos"("di_duimp");

-- CreateIndex
CREATE INDEX "averbacao_processos_n_lote_idx" ON "averbacao_processos"("n_lote");

-- CreateIndex
CREATE INDEX "averbacao_processos_despachante_id_status_idx" ON "averbacao_processos"("despachante_id", "status");

-- CreateIndex
CREATE INDEX "averbacao_processos_cliente_id_idx" ON "averbacao_processos"("cliente_id");

-- CreateIndex
CREATE INDEX "averbacao_documentos_status_idx" ON "averbacao_documentos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "averbacao_documentos_processo_id_tipo_documento_id_key" ON "averbacao_documentos"("processo_id", "tipo_documento_id");

-- CreateIndex
CREATE INDEX "averbacao_historico_documento_id_criado_em_idx" ON "averbacao_historico"("documento_id", "criado_em");

-- AddForeignKey
ALTER TABLE "procuracoes" ADD CONSTRAINT "procuracoes_despachante_id_fkey" FOREIGN KEY ("despachante_id") REFERENCES "despachantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procuracoes" ADD CONSTRAINT "procuracoes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procuracoes" ADD CONSTRAINT "procuracoes_enviado_por_user_id_fkey" FOREIGN KEY ("enviado_por_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procuracao_historico" ADD CONSTRAINT "procuracao_historico_procuracao_id_fkey" FOREIGN KEY ("procuracao_id") REFERENCES "procuracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procuracao_historico" ADD CONSTRAINT "procuracao_historico_autor_user_id_fkey" FOREIGN KEY ("autor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "averbacao_processos" ADD CONSTRAINT "averbacao_processos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "averbacao_processos" ADD CONSTRAINT "averbacao_processos_despachante_id_fkey" FOREIGN KEY ("despachante_id") REFERENCES "despachantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "averbacao_processos" ADD CONSTRAINT "averbacao_processos_criado_por_user_id_fkey" FOREIGN KEY ("criado_por_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "averbacao_documentos" ADD CONSTRAINT "averbacao_documentos_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "averbacao_processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "averbacao_documentos" ADD CONSTRAINT "averbacao_documentos_tipo_documento_id_fkey" FOREIGN KEY ("tipo_documento_id") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "averbacao_historico" ADD CONSTRAINT "averbacao_historico_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "averbacao_documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "averbacao_historico" ADD CONSTRAINT "averbacao_historico_autor_user_id_fkey" FOREIGN KEY ("autor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
