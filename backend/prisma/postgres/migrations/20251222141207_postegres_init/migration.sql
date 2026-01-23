-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPPLIER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'PENDING_ACTIVE', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceCalculationType" AS ENUM ('FIXED', 'PERCENTAGE_CIF', 'PER_CONTAINER', 'PER_TONNE');

-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceCostType" AS ENUM ('DEFAULT', 'CUSTOM', 'ZEROED');

-- CreateTable
CREATE TABLE "companies" (
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
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "companyId" TEXT,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_document_requirements" (
    "id" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "route" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "moduleId" INTEGER NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_permissions" (
    "activityId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "activity_permissions_pkey" PRIMARY KEY ("activityId","permissionId")
);

-- CreateTable
CREATE TABLE "user_module_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_module_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_access" (
    "id" TEXT NOT NULL,
    "userModuleAccessId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_activity_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faturamento" (
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
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "calculationType" "ServiceCalculationType" NOT NULL DEFAULT 'FIXED',
    "formulaExpression" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_costs" (
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
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "simulationNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "displayNumber" TEXT NOT NULL,
    "baseSimulationId" TEXT,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "versionReason" TEXT,
    "supplierId" TEXT NOT NULL,
    "cifUsd" DECIMAL(12,2) NOT NULL,
    "dollarRate" DECIMAL(8,4) NOT NULL,
    "cifBrl" DECIMAL(12,2) NOT NULL,
    "tonnes" DECIMAL(10,3),
    "cntrCount" INTEGER,
    "cntrType" TEXT,
    "storageCost" DECIMAL(10,2),
    "transportCost" DECIMAL(10,2),
    "discount" DECIMAL(10,2),
    "totalServices" DECIMAL(12,2),
    "totalGeneral" DECIMAL(12,2),
    "status" "SimulationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_services" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "costType" "ServiceCostType" NOT NULL DEFAULT 'DEFAULT',
    "originalCost" DECIMAL(10,2) NOT NULL,
    "appliedCost" DECIMAL(10,2) NOT NULL,
    "customReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "company_document_requirements_companyId_documentTypeId_key" ON "company_document_requirements"("companyId", "documentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "activities_moduleId_name_key" ON "activities"("moduleId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_module_access_userId_moduleId_key" ON "user_module_access"("userId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_activity_access_userModuleAccessId_activityId_key" ON "user_activity_access"("userModuleAccessId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");

-- CreateIndex
CREATE INDEX "service_costs_serviceId_validUntil_idx" ON "service_costs"("serviceId", "validUntil");

-- CreateIndex
CREATE INDEX "simulations_supplierId_isCurrentVersion_idx" ON "simulations"("supplierId", "isCurrentVersion");

-- CreateIndex
CREATE UNIQUE INDEX "simulations_simulationNumber_version_key" ON "simulations"("simulationNumber", "version");

-- CreateIndex
CREATE UNIQUE INDEX "simulation_services_simulationId_serviceId_key" ON "simulation_services"("simulationId", "serviceId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_document_requirements" ADD CONSTRAINT "company_document_requirements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_document_requirements" ADD CONSTRAINT "company_document_requirements_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_permissions" ADD CONSTRAINT "activity_permissions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_permissions" ADD CONSTRAINT "activity_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_access" ADD CONSTRAINT "user_module_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_access" ADD CONSTRAINT "user_module_access_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_access" ADD CONSTRAINT "user_activity_access_userModuleAccessId_fkey" FOREIGN KEY ("userModuleAccessId") REFERENCES "user_module_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_access" ADD CONSTRAINT "user_activity_access_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_costs" ADD CONSTRAINT "service_costs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_costs" ADD CONSTRAINT "service_costs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_baseSimulationId_fkey" FOREIGN KEY ("baseSimulationId") REFERENCES "simulations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "simulation_services" ADD CONSTRAINT "simulation_services_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_services" ADD CONSTRAINT "simulation_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
