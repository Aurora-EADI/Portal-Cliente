-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompanyClassification') THEN
    CREATE TYPE "CompanyClassification" AS ENUM ('MEI', 'ME', 'EPP', 'EIRELI');
  END IF;
END
$$;

-- AlterTable
ALTER TABLE "companies"
ADD COLUMN IF NOT EXISTS "allocationRegime" "AllocationRegime" NOT NULL DEFAULT 'NO_WORKFORCE_AT_EADI',
ADD COLUMN IF NOT EXISTS "classification" "CompanyClassification" NOT NULL DEFAULT 'ME';

-- CreateTable
CREATE TABLE IF NOT EXISTS "supplier_types" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supplier_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "company_supplier_types" (
  "companyId" TEXT NOT NULL,
  "supplierTypeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_supplier_types_pkey" PRIMARY KEY ("companyId","supplierTypeId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "company_employees" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "cpf" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "hiredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "document_requirement_rules" (
  "id" TEXT NOT NULL,
  "companyClassification" "CompanyClassification" NOT NULL,
  "allocationRegime" "AllocationRegime" NOT NULL,
  "supplierTypeId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "document_requirement_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "document_requirement_rule_items" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "documentTypeId" INTEGER NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "document_requirement_rule_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "supplier_types_name_key" ON "supplier_types"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "company_employees_companyId_cpf_key" ON "company_employees"("companyId", "cpf");
CREATE INDEX IF NOT EXISTS "company_employees_companyId_idx" ON "company_employees"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "requirement_rule_unique_combo" ON "document_requirement_rules"("companyClassification", "allocationRegime", "supplierTypeId");
CREATE UNIQUE INDEX IF NOT EXISTS "document_requirement_rule_items_ruleId_documentTypeId_key" ON "document_requirement_rule_items"("ruleId", "documentTypeId");
CREATE INDEX IF NOT EXISTS "document_requirement_rule_items_documentTypeId_idx" ON "document_requirement_rule_items"("documentTypeId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_supplier_types_companyId_fkey'
  ) THEN
    ALTER TABLE "company_supplier_types"
    ADD CONSTRAINT "company_supplier_types_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_supplier_types_supplierTypeId_fkey'
  ) THEN
    ALTER TABLE "company_supplier_types"
    ADD CONSTRAINT "company_supplier_types_supplierTypeId_fkey"
    FOREIGN KEY ("supplierTypeId") REFERENCES "supplier_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_employees_companyId_fkey'
  ) THEN
    ALTER TABLE "company_employees"
    ADD CONSTRAINT "company_employees_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'document_requirement_rules_supplierTypeId_fkey'
  ) THEN
    ALTER TABLE "document_requirement_rules"
    ADD CONSTRAINT "document_requirement_rules_supplierTypeId_fkey"
    FOREIGN KEY ("supplierTypeId") REFERENCES "supplier_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'document_requirement_rule_items_ruleId_fkey'
  ) THEN
    ALTER TABLE "document_requirement_rule_items"
    ADD CONSTRAINT "document_requirement_rule_items_ruleId_fkey"
    FOREIGN KEY ("ruleId") REFERENCES "document_requirement_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'document_requirement_rule_items_documentTypeId_fkey'
  ) THEN
    ALTER TABLE "document_requirement_rule_items"
    ADD CONSTRAINT "document_requirement_rule_items_documentTypeId_fkey"
    FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
