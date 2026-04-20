'use client'

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { InspecaoContainerSelectionPage } from '@/components/pages/inspecao-container/InspecaoContainerSelectionPage'
import Header from '@/components/layout/Header'

export default function InspecaoContainerPage() {
  return (
    <RouteGuard route="/inspecao-container">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <InspecaoContainerSelectionPage />
        </Layout>
      </div>
    </RouteGuard>
  )
}
