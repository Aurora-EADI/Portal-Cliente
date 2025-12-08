"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { UserRegistryPage } from '@/components/pages/permissoes/usuario/UserRegistryPage'

export default function PermissoesUsuarioPage() {
  return (
    <RouteGuard route="/permissoes">
      <Layout>
        <UserRegistryPage />
      </Layout>
    </RouteGuard>
  )
}