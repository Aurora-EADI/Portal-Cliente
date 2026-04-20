"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { SupplierList } from '@/components/pages/fornecedor/listaFornecedores/SupplierList'

export default function FornecedorListaPage() {
    return (
        <ModuleRouteShell guard={{ moduleRoute: '/fornecedor', requiredPermissions: ['FOR_VIEW_LIST'] }}>
            <SupplierList />
        </ModuleRouteShell>
    )
}
