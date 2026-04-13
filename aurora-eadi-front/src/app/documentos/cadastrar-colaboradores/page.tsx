"use client"

import { RoleGuard } from '@/components/guards/RoleGuard'
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { DocumentTypesManager } from '@/components/pages/documentos/DocumentTypesManager'
import { UserRole } from '@/types'

export default function WorkforceRequirementsPage() {
  return (
    <RoleGuard
      allowedRoles={[UserRole.ADMIN, UserRole.EMPLOYEE]}
      redirectTo="/documentos"
    >
      <ModuleRouteShell>
        <div className="max-w-4xl mx-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Gerenciar Tipos de Documentos de Colaboradores
            </h1>
            <p className="text-gray-500">
              Cadastre e edite os tipos de documentos exigidos para colaboradores terceirizados.
            </p>
          </div>
          <DocumentTypesManager scope="WORKFORCE" />
        </div>
      </ModuleRouteShell>
    </RoleGuard>
  )
}
