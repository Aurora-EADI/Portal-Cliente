"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { FornecedorSelectionPage } from '@/components/pages/fornecedor/FornecedorSelectionPage'

export default function FornecedorPage() {
    return (
        <ModuleRouteShell>
            <FornecedorSelectionPage />
        </ModuleRouteShell>
    )
}
