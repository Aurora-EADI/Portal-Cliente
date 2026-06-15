"use client"

import { RouteGuard } from '@/components/guards/RouteGuard'
import { TechnicalCatalog } from '@/components/pages/permissoes/catalogo/TechnicalCatalog'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'

export default function PermissoesCatalogoPage() {
    return (
        <RouteGuard route="/permissoes">
            <ModuleRouteShell>
                <TechnicalCatalog />
            </ModuleRouteShell>
        </RouteGuard>
    )
}
