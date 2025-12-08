"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { ActivityRegistry } from '@/components/pages/permissoes/atividades/ActivityRegistry '

export default function PermissoesAtividadesPage() {
  return (
    <RouteGuard route="/permissoes">
      <Layout>
        <ActivityRegistry />
      </Layout>
    </RouteGuard>
  )
}