"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { ServicosSelectionPage } from '@/components/pages/servicos/ServicosSelectionPage'

export default function ServicosPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <ServicosSelectionPage />
      </Layout>
    </div>
  )
}
