"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { DocumentosSelectionPage } from '@/components/pages/documentos/DocumentosSelectionPage'

export default function DocumentosPageRoute() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <DocumentosSelectionPage />
      </Layout>
    </div>
  )
}
