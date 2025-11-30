/*
  Warnings:

  - A unique constraint covering the columns `[moduleId,name]` on the table `activities` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "activities_moduleId_name_key" ON "activities"("moduleId", "name");
