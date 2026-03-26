"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { DocumentosSelectionPage } from '@/components/pages/documentos/DocumentosSelectionPage'

export default function DocumentosPageRoute() {
  return (
    <ModuleRouteShell>
      <DocumentosSelectionPage />
    </ModuleRouteShell>
  )
}
