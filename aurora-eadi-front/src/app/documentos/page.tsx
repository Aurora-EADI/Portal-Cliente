"use client"

import { Layout } from '@/components/layout/Layout'
import { AdminDashboard } from '@/components/pages/documentos/Dashboard'
import { Header } from '@/components/layout/Header'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'

export default function DocumentosPageRoute() {
  return (
    // <PermissionRouteGuard
    //             moduleRoute="/documentos"
    //             requiredPermissions={['DOC_VIEW_GESTAO']}
    //           >
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <AdminDashboard />
      </Layout>
    </div>
    // </PermissionRouteGuard>
  )
}