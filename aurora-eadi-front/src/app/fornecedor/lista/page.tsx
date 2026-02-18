"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { SupplierList } from '@/components/pages/fornecedor/listaFornecedores/SupplierList'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'

export default function FornecedorListaPage() {
    return (
        <PermissionRouteGuard
            moduleRoute="/fornecedor"
            requiredPermissions={['FOR_VIEW_LIST']}
        >
            <div className="h-screen flex flex-col overflow-hidden">
                <Header />
                <Layout>
                    <SupplierList />
                </Layout>
            </div>
        </PermissionRouteGuard>
    )
}
