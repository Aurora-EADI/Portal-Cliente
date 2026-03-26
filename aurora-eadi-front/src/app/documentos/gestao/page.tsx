"use client"

import { AdminDashboard } from '@/components/pages/documentos/Dashboard'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { UserRole } from '@/types'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function DocumentosGestaoPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.EMPLOYEE]} redirectTo="/documentos/empresa">
      <ModuleRouteShell>
        <AdminDashboard />
      </ModuleRouteShell>
    </RoleGuard>
  )
}
