"use client"

import { EstoquePage } from '@/components/pages/estoque/Dashboard'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function EstoqueHistoricoLotePage() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/estoque', requiredPermissions: [] }}>
      <EstoquePage reportType="historico" />
    </ModuleRouteShell>
  )
}
