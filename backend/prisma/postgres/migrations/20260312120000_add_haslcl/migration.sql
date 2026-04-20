-- Add LCL filter flag for services and simulation versions.
-- Keeps behavior similar to `hasStripping`.

ALTER TABLE "services"
ADD COLUMN "hasLcl" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "simulation_versions"
ADD COLUMN "hasLcl" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "simulation_services"
ADD COLUMN "hasLcl" BOOLEAN NOT NULL DEFAULT false;

