-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceCostType" AS ENUM ('DEFAULT', 'CUSTOM', 'ZEROED');

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
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
