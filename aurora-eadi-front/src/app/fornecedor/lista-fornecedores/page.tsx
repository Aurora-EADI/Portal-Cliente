"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { Header } from '@/components/layout/Header'
import { SupplierList } from '@/components/pages/fornecedor/listaFornecedores/SupplierList'

export default function PermissoesPage() {
    return (
        <RouteGuard route="/fornecedor/lista-fornecedores">
            <Header />
            <Layout>
                <SupplierList />
            </Layout>
        </RouteGuard>
    )
}