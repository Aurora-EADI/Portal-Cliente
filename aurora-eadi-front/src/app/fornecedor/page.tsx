"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { Header } from '@/components/layout/Header'
import { RegisterCompanies } from '@/components/pages/permissoes/companies/RegisterCompanies'

export default function PermissoesPage() {
  return (
    <RouteGuard route="/fornecedor">
      <Header />
      <Layout>
        <RegisterCompanies />
      </Layout>
    </RouteGuard>
  )
}