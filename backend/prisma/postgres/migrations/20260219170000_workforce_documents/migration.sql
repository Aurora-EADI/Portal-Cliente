-- CreateTable
CREATE TABLE "workforce_document_requirements" (
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
CREATE TABLE "workforce_documents" (
    "id" TEXT NOT NULL,
    "companyEmployeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE UNIQUE INDEX "workforce_document_requirements_companyId_documentTypeId_key" ON "workforce_document_requirements"("companyId", "documentTypeId");

-- CreateIndex
CREATE INDEX "workforce_document_requirements_companyId_idx" ON "workforce_document_requirements"("companyId");

-- CreateIndex
CREATE INDEX "workforce_document_requirements_documentTypeId_idx" ON "workforce_document_requirements"("documentTypeId");

-- CreateIndex
CREATE INDEX "workforce_documents_companyEmployeeId_idx" ON "workforce_documents"("companyEmployeeId");

-- CreateIndex
CREATE INDEX "workforce_documents_companyId_idx" ON "workforce_documents"("companyId");

-- CreateIndex
CREATE INDEX "workforce_documents_uploadedByUserId_idx" ON "workforce_documents"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "workforce_documents_documentTypeId_idx" ON "workforce_documents"("documentTypeId");

-- CreateIndex
CREATE INDEX "workforce_documents_companyEmployeeId_isLatest_idx" ON "workforce_documents"("companyEmployeeId", "isLatest");

-- AddForeignKey
ALTER TABLE "workforce_document_requirements" ADD CONSTRAINT "workforce_document_requirements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_document_requirements" ADD CONSTRAINT "workforce_document_requirements_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_documents" ADD CONSTRAINT "workforce_documents_companyEmployeeId_fkey" FOREIGN KEY ("companyEmployeeId") REFERENCES "company_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_documents" ADD CONSTRAINT "workforce_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_documents" ADD CONSTRAINT "workforce_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_documents" ADD CONSTRAINT "workforce_documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
