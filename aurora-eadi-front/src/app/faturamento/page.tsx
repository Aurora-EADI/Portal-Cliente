"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { FaturamentoSelectionPage } from '@/components/pages/faturamento/FaturamentoSelectionPage'

export default function FaturamentoPageRoute() {
  return (
    <ModuleRouteShell>
      <FaturamentoSelectionPage />
    </ModuleRouteShell>
  )
}
