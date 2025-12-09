"use client"

import { Layout } from '@/components/layout/Layout'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'
import { CutOff } from '@/components/pages/faturamento/cutoff/Dashboard'
import { Header } from '@/components/layout/Header'

export default function FaturamentoCutOff() {
  return (
    <PermissionRouteGuard
      moduleRoute="/faturamento"
      requiredPermissions={['FAT_VIEW_CUTOFF']}
    >
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <CutOff />
        </Layout>
      </div>
    </PermissionRouteGuard>
  )
}