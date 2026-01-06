"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { TechnicalCatalog } from '@/components/pages/permissoes/catalogo/TechnicalCatalog'
import Header from '@/components/layout/Header'

export default function PermissoesCatalogoPage() {
    return (
        <RouteGuard route="/permissoes">
            <Header />
            <Layout>
                <TechnicalCatalog />
            </Layout>
        </RouteGuard>
    )
}
