-- CreateTable
CREATE TABLE "global_workforce_document_requirements" (
    "id" TEXT NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_workforce_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "global_workforce_document_requirements_documentTypeId_key" ON "global_workforce_document_requirements"("documentTypeId");

-- CreateIndex
CREATE INDEX "global_workforce_document_requirements_active_idx" ON "global_workforce_document_requirements"("active");

-- AddForeignKey
ALTER TABLE "global_workforce_document_requirements" ADD CONSTRAINT "global_workforce_document_requirements_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
