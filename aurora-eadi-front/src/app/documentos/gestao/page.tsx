"use client"

import { Layout } from '@/components/layout/Layout'
import { AdminDashboard } from '@/components/pages/documentos/Dashboard'
import { Header } from '@/components/layout/Header'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { UserRole } from '@/types'

export default function DocumentosGestaoPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.EMPLOYEE]} redirectTo="/documentos/empresa">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <AdminDashboard />
        </Layout>
      </div>
    </RoleGuard>
  )
}
