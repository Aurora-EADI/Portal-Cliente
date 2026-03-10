"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { EstoqueSelectionPage } from '@/components/pages/estoque/EstoqueSelectionPage'

export default function EstoquePageRoute() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <EstoqueSelectionPage />
      </Layout>
    </div>
  )
}
