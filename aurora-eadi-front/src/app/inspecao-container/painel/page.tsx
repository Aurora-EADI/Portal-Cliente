'use client'

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { InspecaoContainerDashboard } from '@/components/pages/inspecao-container/InspecaoContainerDashboard'
import Header from '@/components/layout/Header'

export default function InspecaoContainerPainelPage() {
  return (
    <RouteGuard route="/inspecao-container">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <InspecaoContainerDashboard />
        </Layout>
      </div>
    </RouteGuard>
  )
}
