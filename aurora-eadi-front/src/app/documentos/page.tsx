"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { AdminDashboard } from '@/components/pages/documentos/Dashboard'
import { Header } from '@/components/layout/Header'

export default function DocumentosPageRoute() {
  return (
    <RouteGuard route="/documentos">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <AdminDashboard />
        </Layout>
      </div>
    </RouteGuard>
  )
}