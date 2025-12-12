"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { DocumentTypesManager } from '@/components/pages/documentos/DocumentTypesManager'
import { PermissionGuard } from '@/components/guards/PermissionGuard'

export default function DocumentTypesPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <div className="max-w-4xl mx-auto py-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Tipos de Documentos</h1>
                        <p className="text-gray-500">Cadastre e edite os tipos de documentos exigidos no sistema.</p>
                    </div>
                    <PermissionGuard moduleRoute='/documentos/empresa' permissionKey='DOC_VIEW'>
                        <DocumentTypesManager />
                    </PermissionGuard>
                </div>
            </Layout>
        </div>
    )
}
