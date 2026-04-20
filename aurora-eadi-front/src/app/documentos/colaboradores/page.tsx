"use client"

import { WorkforceDashboard } from '@/components/pages/documentos/colaboradores/Dashboard'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function DocumentosColaboradoresPage() {
  return (
    <ModuleRouteShell>
      <WorkforceDashboard />
    </ModuleRouteShell>
  )
}
