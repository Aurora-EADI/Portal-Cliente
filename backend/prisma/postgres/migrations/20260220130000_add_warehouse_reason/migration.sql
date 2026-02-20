-- CreateEnum (idempotente: ignora se já existir)
DO $$ BEGIN
  CREATE TYPE "WarehouseReason" AS ENUM ('CV', 'MA', 'RF', 'DOC', 'DIV', 'MT', 'P');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable (idempotente: ignora se coluna já existir)
ALTER TABLE "cargo_items" ADD COLUMN IF NOT EXISTS "warehouseReason" "WarehouseReason";
