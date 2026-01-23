"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { ServiceList } from '@/components/pages/servicos/listaServicos/ServiceList'

export default function ServicosPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <ServiceList />
      </Layout>
    </div>
  )
}
