"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { EstoqueSelectionPage } from '@/components/pages/estoque/EstoqueSelectionPage'

export default function EstoquePageRoute() {
  return (
    <ModuleRouteShell>
      <EstoqueSelectionPage />
    </ModuleRouteShell>
  )
}
