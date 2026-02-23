"use client"

import { Header } from '@/components/layout/Header'
import { Layout } from '@/components/layout/Layout'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'
import { DocumentTypesManager } from '@/components/pages/documentos/DocumentTypesManager'

export default function WorkforceRequirementsPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <div className="max-w-4xl mx-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Gerenciar Tipos de Documentos de Colaboradores
            </h1>
            <p className="text-gray-500">
              Cadastre e edite os tipos de documentos exigidos para colaboradores terceirizados.
            </p>
          </div>
          <PermissionRouteGuard
            moduleRoute="/documentos"
            requiredPermissions={['DOC_REGISTER']}
            isBlockPage={true}
          >
            <DocumentTypesManager scope="WORKFORCE" />
          </PermissionRouteGuard>
        </div>
      </Layout>
    </div>
  )
}
