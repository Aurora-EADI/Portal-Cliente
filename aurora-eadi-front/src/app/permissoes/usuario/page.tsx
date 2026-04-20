"use client"

import { RouteGuard } from '@/components/guards/RouteGuard'
import { UserRegistryPage } from '@/components/pages/permissoes/usuario/UserRegistryPage'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function PermissoesUsuarioPage() {
  return (
    <RouteGuard route="/permissoes">
      <ModuleRouteShell>
        <UserRegistryPage />
      </ModuleRouteShell>
    </RouteGuard>
  )
}
