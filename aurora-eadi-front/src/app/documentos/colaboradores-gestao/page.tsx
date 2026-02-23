"use client"

import { Header } from '@/components/layout/Header'
import { Layout } from '@/components/layout/Layout'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { UserRole } from '@/types'
import { WorkforceDocumentsModeration } from '@/components/pages/documentos/WorkforceDocumentsModeration'

export default function WorkforceDocumentsModerationPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.EMPLOYEE]} redirectTo="/documentos/empresa">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <WorkforceDocumentsModeration />
        </Layout>
      </div>
    </RoleGuard>
  )
}
