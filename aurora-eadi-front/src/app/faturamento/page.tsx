"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { FaturamentoPage } from '@/components/pages/faturamento/Dashboard'
import { Header } from '@/components/layout/Header'

export default function FaturamentoPageRoute() {
  return (
    <RouteGuard route="/faturamento">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <FaturamentoPage />
        </Layout>
      </div>
    </RouteGuard>
  )
}