"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { ClienteSelectionPage } from '@/components/pages/clientes/ClienteSelectionPage'

export default function ClientePage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <ClienteSelectionPage />
      </Layout>
    </div>
  )
}
