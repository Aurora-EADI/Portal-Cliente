"use client"

import { RouteGuard } from '@/components/guards/RouteGuard'
import { PermissoesDashboard } from '@/components/pages/permissoes/Dashboard'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function PermissoesPage() {
  return (
    <RouteGuard route="/permissoes">
      <ModuleRouteShell>
        <PermissoesDashboard />
      </ModuleRouteShell>
    </RouteGuard>
  )
}
