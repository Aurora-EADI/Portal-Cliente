"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { RegisterCustomer } from '@/components/pages/clientes/RegisterCustomer'

export default function CadastroCliente() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <RegisterCustomer />
      </Layout>
    </div>
  )
}
