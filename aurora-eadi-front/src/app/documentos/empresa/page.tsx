"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { Header } from '@/components/layout/Header'
import { SupplierDashboard } from '@/components/pages/documentos/empresa/Dashboard'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'

export default function DocumentosPageRouteEmpresa() {
  return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <SupplierDashboard />
        </Layout>
      </div>
  )
}