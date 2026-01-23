"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { PermissoesDashboard } from '@/components/pages/permissoes/Dashboard'
import { Header } from '@/components/layout/Header'

export default function PermissoesPage() {
  return (
    <RouteGuard route="/permissoes">
      <Header />
      <Layout>
        <PermissoesDashboard />
      </Layout>
    </RouteGuard>
  )
}