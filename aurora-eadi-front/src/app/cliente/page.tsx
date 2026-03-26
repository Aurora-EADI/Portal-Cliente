"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { ClienteSelectionPage } from '@/components/pages/clientes/ClienteSelectionPage'

export default function ClientePage() {
  return (
    <ModuleRouteShell>
      <ClienteSelectionPage />
    </ModuleRouteShell>
  )
}
