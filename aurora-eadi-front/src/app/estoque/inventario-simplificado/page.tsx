"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { EstoquePage } from '@/components/pages/estoque/Dashboard'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'

export default function EstoqueInventarioSimplificadoPage() {
  return (
    <PermissionRouteGuard moduleRoute="/estoque" requiredPermissions={[]}>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <EstoquePage reportType="simplificado" />
        </Layout>
      </div>
    </PermissionRouteGuard>
  )
}
