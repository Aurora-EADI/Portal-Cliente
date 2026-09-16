-- RabbitMQ durable delivery: inbox idempotency, transactional outbox and
-- agendamento status audit. Additive only; existing DI data stays intact.

CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED');

ALTER TABLE "dis_averbadas"
  ADD COLUMN "aurora_di_id" TEXT,
  ADD COLUMN "cpf_motorista" TEXT,
  ADD COLUMN "dt_averbacao" TIMESTAMP(3),
  ADD COLUMN "numero_di" TEXT,
  ADD COLUMN "placa_veiculo" TEXT;

CREATE TABLE "di_averbada_containers" (
  "id" TEXT NOT NULL,
  "n_lote" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  CONSTRAINT "di_averbada_containers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "processed_events" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processed_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_events" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "aggregate_type" TEXT NOT NULL,
  "aggregate_id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMP(3),
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_error" TEXT,
  "lease_token" TEXT,
  "locked_at" TIMESTAMP(3),
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agendamento_status_historico" (
  "id" TEXT NOT NULL,
  "agendamento_id" TEXT NOT NULL,
  "status" "AgendamentoStatus" NOT NULL,
  "previous_status" "AgendamentoStatus",
  "operador_id" TEXT,
  "dt_alteracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agendamento_status_historico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "di_averbada_containers_n_lote_external_id_key"
  ON "di_averbada_containers"("n_lote", "external_id");
CREATE UNIQUE INDEX "processed_events_event_id_key" ON "processed_events"("event_id");
CREATE INDEX "processed_events_event_type_processed_at_idx"
  ON "processed_events"("event_type", "processed_at");
CREATE UNIQUE INDEX "outbox_events_event_id_key" ON "outbox_events"("event_id");
CREATE INDEX "outbox_events_status_next_attempt_at_idx"
  ON "outbox_events"("status", "next_attempt_at");
CREATE INDEX "agendamento_status_historico_agendamento_id_dt_alteracao_idx"
  ON "agendamento_status_historico"("agendamento_id", "dt_alteracao");
CREATE UNIQUE INDEX "dis_averbadas_aurora_di_id_key" ON "dis_averbadas"("aurora_di_id");

ALTER TABLE "di_averbada_containers"
  ADD CONSTRAINT "di_averbada_containers_n_lote_fkey"
  FOREIGN KEY ("n_lote") REFERENCES "dis_averbadas"("n_lote") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agendamento_status_historico"
  ADD CONSTRAINT "agendamento_status_historico_agendamento_id_fkey"
  FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
