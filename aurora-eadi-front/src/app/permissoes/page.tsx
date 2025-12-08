"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { PermissoesDashboard } from '@/components/pages/permissoes/Dashboard'

export default function PermissoesPage() {
  return (
    <RouteGuard route="/permissoes">
      <Layout>
        <PermissoesDashboard />
      </Layout>
    </RouteGuard>
  )
}