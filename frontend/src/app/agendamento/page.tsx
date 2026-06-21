"use client"

import { RouteGuard } from '@/components/guards/RouteGuard'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { AgendamentoPage } from '@/components/pages/agendamento/AgendamentoPage'

export default function AgendamentoRoute() {
  return (
    <RouteGuard route="/agendamento">
      <ModuleRouteShell layout={{ maxWidth: 'full', noPadding: true }}>
        <AgendamentoPage />
      </ModuleRouteShell>
    </RouteGuard>
  )
}
