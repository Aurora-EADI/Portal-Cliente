"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { Header } from '@/components/layout/Header'
import { SupplierList } from '@/components/pages/fornecedor/listaFornecedores/SupplierList'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'

export default function PermissoesPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <PermissionRouteGuard
                  moduleRoute="/fornecedor"
                  requiredPermissions={['FOR_VIEW_LIST']}
                >
                <Header />
                <Layout>
                    <SupplierList />
                </Layout>
            </PermissionRouteGuard>
        </div>
    )
}