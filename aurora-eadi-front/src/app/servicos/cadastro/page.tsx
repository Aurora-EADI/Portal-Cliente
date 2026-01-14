"use client"

import { Layout } from '@/components/layout/Layout'
import { Header } from '@/components/layout/Header'
import { RegisterService } from '@/components/pages/servicos/RegisterService'

export default function CadastroServico() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <RegisterService />
      </Layout>
    </div>
  )
}
