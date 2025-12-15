-- CreateEnum
CREATE TYPE "ServiceCalculationType" AS ENUM ('FIXED', 'PERCENTAGE_CIF', 'PER_CONTAINER', 'PER_TONNE');

-- AlterTable
ALTER TABLE "services" ADD COLUMN "calculationType" "ServiceCalculationType" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "services" ADD COLUMN "formulaExpression" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "services"."calculationType" IS 'Tipo de cálculo: FIXED (valor fixo), PERCENTAGE_CIF (% do CIF), PER_CONTAINER (valor × containers), PER_TONNE (valor × toneladas)';
COMMENT ON COLUMN "services"."formulaExpression" IS 'Fórmula para exibição (ex: "0.35% do CIF", "R$ 350 por container")';
COMMENT ON COLUMN "service_costs"."cost" IS 'Taxa base (não é valor final). Ex: 0.35 para percentual, 350 para valor por unidade';
