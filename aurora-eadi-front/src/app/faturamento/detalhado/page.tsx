"use client"

import { Layout } from '@/components/layout/Layout'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'
import { FaturamentoPage } from '@/components/pages/faturamento/Dashboard'
import { Header } from '@/components/layout/Header'

export default function FaturamentoDetalhadoPage() {
  return (
    <PermissionRouteGuard
      moduleRoute="/faturamento"
      requiredPermissions={['FAT_VIEW_DASH']}
    >
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <FaturamentoPage />
        </Layout>
      </div>
    </PermissionRouteGuard>
  )
}
