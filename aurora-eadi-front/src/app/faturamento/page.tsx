"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { FaturamentoSelectionPage } from '@/components/pages/faturamento/FaturamentoSelectionPage'

export default function FaturamentoPageRoute() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <FaturamentoSelectionPage />
      </Layout>
    </div>
  )
}
