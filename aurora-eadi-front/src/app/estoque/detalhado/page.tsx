"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { EstoquePage } from '@/components/pages/estoque/Dashboard'

export default function EstoqueDetalhadoPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <EstoquePage />
      </Layout>
    </div>
  )
}
