"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { CutOff } from '@/components/pages/faturamento/cutoff/Dashboard'

export default function FaturamentoCutOff() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/faturamento', requiredPermissions: ['FAT_VIEW_CUTOFF'] }}>
      <CutOff />
    </ModuleRouteShell>
  )
}
