"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { UserRegistryPage } from '@/components/pages/permissoes/usuario/UserRegistryPage'
import Header from '@/components/layout/Header'

export default function PermissoesUsuarioPage() {
  return (
    <RouteGuard route="/permissoes">
      <Header />
      <Layout>
        <UserRegistryPage />
      </Layout>
    </RouteGuard>
  )
}