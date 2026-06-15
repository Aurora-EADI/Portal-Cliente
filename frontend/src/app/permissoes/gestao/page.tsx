"use client"

import { RouteGuard } from '@/components/guards/RouteGuard'
import { PermissionManagerPage } from '@/components/pages/permissoes/gestao/PermissionManagerPage'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function PermissoesGestaoPage() {
  return (
    <RouteGuard route="/permissoes">
      <ModuleRouteShell>
        <PermissionManagerPage />
      </ModuleRouteShell>
    </RouteGuard>
  )
}
