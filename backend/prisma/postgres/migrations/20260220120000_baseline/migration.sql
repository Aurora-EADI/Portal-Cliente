-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AirServiceCalculationType" AS ENUM ('FIXED', 'PERCENTAGE_CIF', 'PER_KG', 'PER_TONNE');

-- CreateEnum
CREATE TYPE "public"."AllocationRegime" AS ENUM ('NO_WORKFORCE_AT_EADI', 'FULL_WORKFORCE_AT_EADI');

-- CreateEnum
CREATE TYPE "public"."CargoItemStatus" AS ENUM ('EM_ANALISE', 'DTA_REGISTRADA', 'ENVIADO');

-- CreateEnum
CREATE TYPE "public"."CompanyClassification" AS ENUM ('MEI', 'ME', 'EPP', 'EIRELI');

-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('PENDING', 'PENDING_ACTIVE', 'ACTIVE', 'REJECTED', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."DocumentFrequency" AS ENUM ('UNICO', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."FlightHistoryType" AS ENUM ('EDIT', 'REVERT');

-- CreateEnum
CREATE TYPE "public"."FlightStatus" AS ENUM ('PENDING', 'SENT');

-- CreateEnum
CREATE TYPE "public"."ServiceCalculationType" AS ENUM ('FIXED', 'PERCENTAGE_CIF', 'PER_CONTAINER', 'PER_TONNE');

-- CreateEnum
CREATE TYPE "public"."ServiceCostType" AS ENUM ('DEFAULT', 'CUSTOM', 'ZEROED');

-- CreateEnum
CREATE TYPE "public"."ServiceModal" AS ENUM ('AIR', 'MARITIME', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."SimulationStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."TCOption" AS ENUM ('P', 'A');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('REFRESH', 'RESET_PASSWORD', 'EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'SUPPLIER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "public"."activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "moduleId" INTEGER NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "label" TEXT,
    "route" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_permissions" (
    "activityId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "activity_permissions_pkey" PRIMARY KEY ("activityId","permissionId")
);

-- CreateTable
CREATE TABLE "public"."air_simulation_services" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "calculationType" "public"."AirServiceCalculationType" NOT NULL,
    "costType" "public"."ServiceCostType" NOT NULL,
    "originalCost" DECIMAL(10,2) NOT NULL,
    "appliedCost" DECIMAL(10,2) NOT NULL,
    "customReason" TEXT,

    CONSTRAINT "air_simulation_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."air_simulation_versions" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "displayNumber" TEXT NOT NULL,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "versionReason" TEXT,
    "status" "public"."SimulationStatus" NOT NULL DEFAULT 'DRAFT',
    "cifUsd" DECIMAL(15,2) NOT NULL,
    "dollarRate" DECIMAL(10,4) NOT NULL,
    "cifBrl" DECIMAL(15,2) NOT NULL,
    "weightKg" DECIMAL(15,3),
    "volumeM3" DECIMAL(15,3),
    "storageCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transportCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalServices" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalGeneral" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "minBillingValue" DECIMAL(10,2) NOT NULL DEFAULT 350,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "baseVersionId" TEXT,
    "capataziaCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "auroraPeriods" INTEGER NOT NULL DEFAULT 1,
    "vinciPeriods" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "air_simulation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."air_simulations" (
    "id" TEXT NOT NULL,
    "simulationNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "air_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cargo_items" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "house" TEXT NOT NULL,
    "importer" TEXT NOT NULL,
    "dta" TEXT NOT NULL DEFAULT '',
    "tc" "public"."TCOption" NOT NULL DEFAULT 'P',
    "status" "public"."CargoItemStatus" NOT NULL DEFAULT 'EM_ANALISE',
    "responsible" TEXT NOT NULL DEFAULT '',
    "observations" TEXT NOT NULL DEFAULT '',
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "number" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "cargo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "fantasyName" TEXT NOT NULL,
    "socialReason" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "public"."CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statusChangedAt" TIMESTAMP(3),
    "statusReason" TEXT,
    "allocationRegime" "public"."AllocationRegime" NOT NULL DEFAULT 'NO_WORKFORCE_AT_EADI',
    "classification" "public"."CompanyClassification" NOT NULL DEFAULT 'ME',

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_document_requirements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isAutomatic" BOOLEAN DEFAULT false,
    "requirementType" TEXT,

    CONSTRAINT "company_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_employees" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "hiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "company_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_supplier_types" (
    "companyId" TEXT NOT NULL,
    "supplierTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_supplier_types_pkey" PRIMARY KEY ("companyId","supplierTypeId")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "status" "public"."CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT,
    "complement" TEXT,
    "contact" TEXT,
    "corporateName" TEXT,
    "neighborhood" TEXT,
    "number" TEXT,
    "state" TEXT,
    "street" TEXT,
    "zipCode" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_requirement_rule_items" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_requirement_rule_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_requirement_rules" (
    "id" TEXT NOT NULL,
    "companyClassification" "public"."CompanyClassification" NOT NULL,
    "allocationRegime" "public"."AllocationRegime" NOT NULL,
    "supplierTypeId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_requirement_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptsPositiveCertificate" BOOLEAN NOT NULL DEFAULT false,
    "frequency" "public"."DocumentFrequency" NOT NULL DEFAULT 'UNICO',
    "hasExpirationControl" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "dateIssue" TIMESTAMP(3),
    "dateExpiration" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentTypeId" INTEGER,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."faturamento" (
    "id" SERIAL NOT NULL,
    "cod_cli" VARCHAR(50) NOT NULL,
    "n_fatura" VARCHAR(50) NOT NULL,
    "cliente" VARCHAR(255) NOT NULL,
    "endereco" VARCHAR(255),
    "bairro" VARCHAR(100),
    "cidade" VARCHAR(100),
    "uf" VARCHAR(2),
    "cep" VARCHAR(10),
    "cgc" VARCHAR(20),
    "insc_esta" VARCHAR(50),
    "insc_munic" VARCHAR(50),
    "rps" VARCHAR(50),
    "tp_nota" VARCHAR(20),
    "vl_extenso" VARCHAR(255),
    "valor_fatura" DECIMAL(10,2) NOT NULL,
    "valor_servicos" DECIMAL(10,2) NOT NULL,
    "dt_fatura" DATE NOT NULL,
    "dt_vencimento" DATE NOT NULL,
    "dt_entrada" DATE,
    "iss_cobrar" VARCHAR(5),
    "iss_valor" DECIMAL(10,2),
    "iss_percentual" DECIMAL(5,2),
    "iii_valor" DECIMAL(10,2),
    "tributacao_msg" TEXT,
    "observacao" TEXT,
    "modalidade" VARCHAR(50),
    "despachante" VARCHAR(100),
    "valor_cif" DECIMAL(16,2),
    "n_da" VARCHAR(50),
    "n_di" VARCHAR(50),
    "n_lote" VARCHAR(50),
    "n_conhecimento" VARCHAR(50),
    "n_documento" VARCHAR(50),
    "tx_dolar" DECIMAL(10,4),
    "nr_periodo_i" INTEGER,
    "nr_periodo_f" INTEGER,
    "dt_periodo_f" DATE,
    "qt_volumes" INTEGER,
    "peso_bruto" DECIMAL(10,2),
    "m3" DECIMAL(10,2),
    "quantidade" INTEGER,
    "servico_id" VARCHAR(50),
    "servico" TEXT,
    "valor" DECIMAL(10,2),
    "modalidade_txt" VARCHAR(100),

    CONSTRAINT "faturamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flight_history" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "type" "public"."FlightHistoryType" NOT NULL,
    "changes" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flights" (
    "id" TEXT NOT NULL,
    "aircraftName" TEXT NOT NULL,
    "arrivalDate" DATE NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "flightCode" TEXT NOT NULL,
    "status" "public"."FlightStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "termoEntrada" TEXT,

    CONSTRAINT "flights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."global_workforce_document_requirements" (
    "id" TEXT NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_workforce_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."module_shared_items" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "targetRoute" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "module_shared_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "route" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_costs" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "calculationType" "public"."ServiceCalculationType" NOT NULL DEFAULT 'FIXED',
    "formulaExpression" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasStripping" BOOLEAN NOT NULL DEFAULT false,
    "modal" "public"."ServiceModal" NOT NULL DEFAULT 'BOTH',

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."simulation_services" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "calculationType" "public"."ServiceCalculationType" NOT NULL,
    "hasStripping" BOOLEAN NOT NULL DEFAULT false,
    "costType" "public"."ServiceCostType" NOT NULL,
    "originalCost" DECIMAL(10,2) NOT NULL,
    "appliedCost" DECIMAL(10,2) NOT NULL,
    "customReason" TEXT,

    CONSTRAINT "simulation_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."simulation_versions" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "displayNumber" TEXT NOT NULL,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "versionReason" TEXT,
    "status" "public"."SimulationStatus" NOT NULL DEFAULT 'DRAFT',
    "cifUsd" DECIMAL(15,2) NOT NULL,
    "dollarRate" DECIMAL(10,4) NOT NULL,
    "cifBrl" DECIMAL(15,2) NOT NULL,
    "tonnes" DECIMAL(15,3),
    "cntrCount" INTEGER,
    "cntrType" TEXT,
    "storageCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transportCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalServices" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalGeneral" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hasStripping" BOOLEAN NOT NULL DEFAULT false,
    "minBillingValue" DECIMAL(10,2) NOT NULL DEFAULT 5500,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "baseVersionId" TEXT,
    "auroraPeriods" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "simulation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."simulations" (
    "id" TEXT NOT NULL,
    "simulationNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supplier_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_activity_access" (
    "id" TEXT NOT NULL,
    "userModuleAccessId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_activity_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_module_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_module_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "companyId" TEXT,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workforce_document_requirements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workforce_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workforce_documents" (
    "id" TEXT NOT NULL,
    "companyEmployeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "dateIssue" TIMESTAMP(3),
    "dateExpiration" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentTypeId" INTEGER,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "workforce_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activities_moduleId_name_key" ON "public"."activities"("moduleId" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "air_simulation_services_versionId_serviceId_key" ON "public"."air_simulation_services"("versionId" ASC, "serviceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "air_simulations_simulationNumber_key" ON "public"."air_simulations"("simulationNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "public"."companies"("cnpj" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "company_document_requirements_companyId_documentTypeId_key" ON "public"."company_document_requirements"("companyId" ASC, "documentTypeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "company_employees_companyId_cpf_key" ON "public"."company_employees"("companyId" ASC, "cpf" ASC);

-- CreateIndex
CREATE INDEX "company_employees_companyId_idx" ON "public"."company_employees"("companyId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "public"."customers"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_key" ON "public"."customers"("document" ASC);

-- CreateIndex
CREATE INDEX "document_requirement_rule_items_documentTypeId_idx" ON "public"."document_requirement_rule_items"("documentTypeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "document_requirement_rule_items_ruleId_documentTypeId_key" ON "public"."document_requirement_rule_items"("ruleId" ASC, "documentTypeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "document_requirement_rules_companyClassification_allocation_key" ON "public"."document_requirement_rules"("companyClassification" ASC, "allocationRegime" ASC, "supplierTypeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "requirement_rule_unique_combo" ON "public"."document_requirement_rules"("companyClassification" ASC, "allocationRegime" ASC, "supplierTypeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "public"."document_types"("name" ASC);

-- CreateIndex
CREATE INDEX "flight_history_flightId_idx" ON "public"."flight_history"("flightId" ASC);

-- CreateIndex
CREATE INDEX "global_workforce_document_requirements_active_idx" ON "public"."global_workforce_document_requirements"("active" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "global_workforce_document_requirements_documentTypeId_key" ON "public"."global_workforce_document_requirements"("documentTypeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "module_shared_items_moduleId_targetRoute_key" ON "public"."module_shared_items"("moduleId" ASC, "targetRoute" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "public"."modules"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "public"."permissions"("key" ASC);

-- CreateIndex
CREATE INDEX "service_costs_serviceId_validUntil_idx" ON "public"."service_costs"("serviceId" ASC, "validUntil" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "public"."services"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "simulations_simulationNumber_key" ON "public"."simulations"("simulationNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_types_name_key" ON "public"."supplier_types"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_activity_access_userModuleAccessId_activityId_key" ON "public"."user_activity_access"("userModuleAccessId" ASC, "activityId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_module_access_userId_moduleId_key" ON "public"."user_module_access"("userId" ASC, "moduleId" ASC);

-- CreateIndex
CREATE INDEX "user_tokens_expiresAt_idx" ON "public"."user_tokens"("expiresAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_token_key" ON "public"."user_tokens"("token" ASC);

-- CreateIndex
CREATE INDEX "user_tokens_token_type_idx" ON "public"."user_tokens"("token" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "user_tokens_userId_type_idx" ON "public"."user_tokens"("userId" ASC, "type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "workforce_document_requirements_companyId_documentTypeId_key" ON "public"."workforce_document_requirements"("companyId" ASC, "documentTypeId" ASC);

-- CreateIndex
CREATE INDEX "workforce_document_requirements_companyId_idx" ON "public"."workforce_document_requirements"("companyId" ASC);

-- CreateIndex
CREATE INDEX "workforce_document_requirements_documentTypeId_idx" ON "public"."workforce_document_requirements"("documentTypeId" ASC);

-- CreateIndex
CREATE INDEX "workforce_documents_companyEmployeeId_idx" ON "public"."workforce_documents"("companyEmployeeId" ASC);

-- CreateIndex
CREATE INDEX "workforce_documents_companyEmployeeId_isLatest_idx" ON "public"."workforce_documents"("companyEmployeeId" ASC, "isLatest" ASC);

-- CreateIndex
CREATE INDEX "workforce_documents_companyId_idx" ON "public"."workforce_documents"("companyId" ASC);

-- CreateIndex
CREATE INDEX "workforce_documents_documentTypeId_idx" ON "public"."workforce_documents"("documentTypeId" ASC);

-- CreateIndex
CREATE INDEX "workforce_documents_uploadedByUserId_idx" ON "public"."workforce_documents"("uploadedByUserId" ASC);

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_permissions" ADD CONSTRAINT "activity_permissions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_permissions" ADD CONSTRAINT "activity_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."air_simulation_services" ADD CONSTRAINT "air_simulation_services_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "public"."air_simulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."air_simulation_versions" ADD CONSTRAINT "air_simulation_versions_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "public"."air_simulation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."air_simulation_versions" ADD CONSTRAINT "air_simulation_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."air_simulation_versions" ADD CONSTRAINT "air_simulation_versions_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "public"."air_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."air_simulations" ADD CONSTRAINT "air_simulations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cargo_items" ADD CONSTRAINT "cargo_items_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "public"."flights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_document_requirements" ADD CONSTRAINT "company_document_requirements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_document_requirements" ADD CONSTRAINT "company_document_requirements_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_employees" ADD CONSTRAINT "company_employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_supplier_types" ADD CONSTRAINT "company_supplier_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_supplier_types" ADD CONSTRAINT "company_supplier_types_supplierTypeId_fkey" FOREIGN KEY ("supplierTypeId") REFERENCES "public"."supplier_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_requirement_rule_items" ADD CONSTRAINT "document_requirement_rule_items_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_requirement_rule_items" ADD CONSTRAINT "document_requirement_rule_items_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."document_requirement_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_requirement_rules" ADD CONSTRAINT "document_requirement_rules_supplierTypeId_fkey" FOREIGN KEY ("supplierTypeId") REFERENCES "public"."supplier_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_history" ADD CONSTRAINT "flight_history_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "public"."flights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."global_workforce_document_requirements" ADD CONSTRAINT "global_workforce_document_requirements_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_shared_items" ADD CONSTRAINT "module_shared_items_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_costs" ADD CONSTRAINT "service_costs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_costs" ADD CONSTRAINT "service_costs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."simulation_services" ADD CONSTRAINT "simulation_services_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "public"."simulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."simulation_versions" ADD CONSTRAINT "simulation_versions_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "public"."simulation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."simulation_versions" ADD CONSTRAINT "simulation_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."simulation_versions" ADD CONSTRAINT "simulation_versions_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "public"."simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."simulations" ADD CONSTRAINT "simulations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_activity_access" ADD CONSTRAINT "user_activity_access_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_activity_access" ADD CONSTRAINT "user_activity_access_userModuleAccessId_fkey" FOREIGN KEY ("userModuleAccessId") REFERENCES "public"."user_module_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_module_access" ADD CONSTRAINT "user_module_access_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_module_access" ADD CONSTRAINT "user_module_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_tokens" ADD CONSTRAINT "user_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workforce_document_requirements" ADD CONSTRAINT "workforce_document_requirements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workforce_document_requirements" ADD CONSTRAINT "workforce_document_requirements_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workforce_documents" ADD CONSTRAINT "workforce_documents_companyEmployeeId_fkey" FOREIGN KEY ("companyEmployeeId") REFERENCES "public"."company_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workforce_documents" ADD CONSTRAINT "workforce_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workforce_documents" ADD CONSTRAINT "workforce_documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workforce_documents" ADD CONSTRAINT "workforce_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

