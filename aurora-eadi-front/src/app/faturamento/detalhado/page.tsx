"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { FaturamentoPage } from '@/components/pages/faturamento/Dashboard'

export default function FaturamentoDetalhadoPage() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/faturamento', requiredPermissions: ['FAT_VIEW_DASH'] }}>
      <FaturamentoPage />
    </ModuleRouteShell>
  )
}
