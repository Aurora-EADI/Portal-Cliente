"use client"

import { EstoquePage } from '@/components/pages/estoque/Dashboard'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function EstoqueInventarioSimplificadoPage() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/estoque', requiredPermissions: [] }}>
      <EstoquePage reportType="simplificado" />
    </ModuleRouteShell>
  )
}
