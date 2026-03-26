"use client"

import { SupplierDashboard } from '@/components/pages/documentos/empresa/Dashboard'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function DocumentosPageRouteEmpresa() {
  return (
    <ModuleRouteShell>
      <SupplierDashboard />
    </ModuleRouteShell>
  )
}
