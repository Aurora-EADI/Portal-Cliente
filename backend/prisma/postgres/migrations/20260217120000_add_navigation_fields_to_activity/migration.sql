-- AlterTable
ALTER TABLE "activities" ADD COLUMN "route" TEXT;
ALTER TABLE "activities" ADD COLUMN "label" TEXT;
ALTER TABLE "activities" ADD COLUMN "icon" TEXT;
ALTER TABLE "activities" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "module_shared_items" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "targetRoute" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "module_shared_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_shared_items_moduleId_targetRoute_key" ON "module_shared_items"("moduleId", "targetRoute");

-- AddForeignKey
ALTER TABLE "module_shared_items" ADD CONSTRAINT "module_shared_items_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
