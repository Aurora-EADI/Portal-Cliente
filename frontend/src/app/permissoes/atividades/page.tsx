"use client"

import { RouteGuard } from '@/components/guards/RouteGuard'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { ActivityRegistry } from '@/components/pages/permissoes/atividades/ActivityRegistry'

export default function PermissoesAtividadesPage() {
  return (
    <RouteGuard route="/permissoes">
      <ModuleRouteShell>
        <ActivityRegistry />
      </ModuleRouteShell>
    </RouteGuard>
  )
}
