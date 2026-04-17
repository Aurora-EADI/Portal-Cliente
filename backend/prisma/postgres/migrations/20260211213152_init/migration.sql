/*
  Warnings:

  - The primary key for the `company_document_requirements` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `simulation_services` table. All the data in the column will be lost.
  - You are about to drop the column `simulationId` on the `simulation_services` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `simulation_services` table. All the data in the column will be lost.
  - You are about to drop the column `baseSimulationId` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `cifBrl` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `cifUsd` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `cntrCount` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `cntrType` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `displayNumber` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `dollarRate` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `isCurrentVersion` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `storageCost` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `tonnes` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `totalGeneral` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `totalServices` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `transportCost` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `simulations` table. All the data in the column will be lost.
  - You are about to drop the column `versionReason` on the `simulations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[simulationNumber]` on the table `simulations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `calculationType` to the `simulation_services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceCode` to the `simulation_services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceName` to the `simulation_services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versionId` to the `simulation_services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `simulations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('REFRESH', 'RESET_PASSWORD', 'EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AirServiceCalculationType" AS ENUM ('FIXED', 'PERCENTAGE_CIF', 'PER_KG', 'PER_TONNE');

-- CreateEnum
CREATE TYPE "DocumentFrequency" AS ENUM ('UNICO', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "ServiceModal" AS ENUM ('MARITIME', 'AIR', 'BOTH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CompanyStatus" ADD VALUE 'INACTIVE';
ALTER TYPE "CompanyStatus" ADD VALUE 'BLOCKED';

-- DropForeignKey
ALTER TABLE "public"."simulation_services" DROP CONSTRAINT "simulation_services_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."simulation_services" DROP CONSTRAINT "simulation_services_simulationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."simulations" DROP CONSTRAINT "simulations_baseSimulationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."simulations" DROP CONSTRAINT "simulations_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."simulations" DROP CONSTRAINT "simulations_supplierId_fkey";

-- DropIndex
DROP INDEX "public"."simulation_services_simulationId_serviceId_key";

-- DropIndex
DROP INDEX "public"."simulations_simulationNumber_version_key";

-- DropIndex
DROP INDEX "public"."simulations_supplierId_isCurrentVersion_idx";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "statusChangedAt" TIMESTAMP(3),
ADD COLUMN     "statusReason" TEXT;

-- AlterTable
ALTER TABLE "company_document_requirements" DROP CONSTRAINT "company_document_requirements_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "company_document_requirements_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "company_document_requirements_id_seq";

-- AlterTable
ALTER TABLE "document_types" ADD COLUMN     "acceptsPositiveCertificate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "frequency" "DocumentFrequency" NOT NULL DEFAULT 'UNICO',
ADD COLUMN     "hasExpirationControl" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "hasStripping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "modal" "ServiceModal" NOT NULL DEFAULT 'BOTH';

-- AlterTable
ALTER TABLE "simulation_services" DROP COLUMN "createdAt",
DROP COLUMN "simulationId",
DROP COLUMN "updatedAt",
ADD COLUMN     "calculationType" "ServiceCalculationType" NOT NULL,
ADD COLUMN     "hasStripping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serviceCode" TEXT NOT NULL,
ADD COLUMN     "serviceName" TEXT NOT NULL,
ADD COLUMN     "versionId" TEXT NOT NULL,
ALTER COLUMN "serviceId" DROP NOT NULL,
ALTER COLUMN "costType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "simulations" DROP COLUMN "baseSimulationId",
DROP COLUMN "cifBrl",
DROP COLUMN "cifUsd",
DROP COLUMN "cntrCount",
DROP COLUMN "cntrType",
DROP COLUMN "createdBy",
DROP COLUMN "discount",
DROP COLUMN "displayNumber",
DROP COLUMN "dollarRate",
DROP COLUMN "isCurrentVersion",
DROP COLUMN "status",
DROP COLUMN "storageCost",
DROP COLUMN "supplierId",
DROP COLUMN "tonnes",
DROP COLUMN "totalGeneral",
DROP COLUMN "totalServices",
DROP COLUMN "transportCost",
DROP COLUMN "version",
DROP COLUMN "versionReason",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
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
CREATE TABLE "simulation_versions" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "displayNumber" TEXT NOT NULL,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "versionReason" TEXT,
    "status" "SimulationStatus" NOT NULL DEFAULT 'DRAFT',
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
    "auroraPeriods" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "baseVersionId" TEXT,

    CONSTRAINT "simulation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
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
CREATE TABLE "air_simulations" (
    "id" TEXT NOT NULL,
    "simulationNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "air_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "air_simulation_versions" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "displayNumber" TEXT NOT NULL,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "versionReason" TEXT,
    "status" "SimulationStatus" NOT NULL DEFAULT 'DRAFT',
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
    "auroraPeriods" INTEGER NOT NULL DEFAULT 1,
    "vinciPeriods" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "baseVersionId" TEXT,
    "capataziaCost" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "air_simulation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "air_simulation_services" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "calculationType" "AirServiceCalculationType" NOT NULL,
    "costType" "ServiceCostType" NOT NULL,
    "originalCost" DECIMAL(10,2) NOT NULL,
    "appliedCost" DECIMAL(10,2) NOT NULL,
    "customReason" TEXT,

    CONSTRAINT "air_simulation_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_token_key" ON "user_tokens"("token");

-- CreateIndex
CREATE INDEX "user_tokens_userId_type_idx" ON "user_tokens"("userId", "type");

-- CreateIndex
CREATE INDEX "user_tokens_token_type_idx" ON "user_tokens"("token", "type");

-- CreateIndex
CREATE INDEX "user_tokens_expiresAt_idx" ON "user_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_key" ON "customers"("document");

-- CreateIndex
CREATE UNIQUE INDEX "air_simulations_simulationNumber_key" ON "air_simulations"("simulationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "air_simulation_services_versionId_serviceId_key" ON "air_simulation_services"("versionId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "simulations_simulationNumber_key" ON "simulations"("simulationNumber");

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_versions" ADD CONSTRAINT "simulation_versions_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "simulation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_versions" ADD CONSTRAINT "simulation_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_versions" ADD CONSTRAINT "simulation_versions_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_services" ADD CONSTRAINT "simulation_services_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "simulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "air_simulations" ADD CONSTRAINT "air_simulations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "air_simulation_versions" ADD CONSTRAINT "air_simulation_versions_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "air_simulation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "air_simulation_versions" ADD CONSTRAINT "air_simulation_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "air_simulation_versions" ADD CONSTRAINT "air_simulation_versions_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "air_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "air_simulation_services" ADD CONSTRAINT "air_simulation_services_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "air_simulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
