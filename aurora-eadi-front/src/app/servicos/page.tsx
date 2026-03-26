"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { ServicosSelectionPage } from '@/components/pages/servicos/ServicosSelectionPage'

export default function ServicosPage() {
  return (
    <ModuleRouteShell>
      <ServicosSelectionPage />
    </ModuleRouteShell>
  )
}
