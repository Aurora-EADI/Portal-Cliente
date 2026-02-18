"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { FornecedorSelectionPage } from '@/components/pages/fornecedor/FornecedorSelectionPage'

export default function FornecedorPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <FornecedorSelectionPage />
            </Layout>
        </div>
    )
}
