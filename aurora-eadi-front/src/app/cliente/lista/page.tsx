"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { CustomerList } from '@/components/pages/clientes/listaClientes/CustomerList'

export default function ClienteListaPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <CustomerList />
      </Layout>
    </div>
  )
}
