-- CreateEnum
CREATE TYPE "WarehouseReason" AS ENUM ('CV', 'MA', 'RF', 'DOC', 'DIV', 'MT', 'P');

-- AlterTable
ALTER TABLE "cargo_items" ADD COLUMN "warehouseReason" "WarehouseReason";
