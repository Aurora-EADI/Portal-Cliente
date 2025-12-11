"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { PermissionManagerPage } from '@/components/pages/permissoes/gestao/PermissionManagerPage'
import { Header } from '@/components/layout/Header'

export default function PermissoesGestaoPage() {
  return (
    <RouteGuard route="/permissoes">
      <Header />
      <Layout>
        <PermissionManagerPage />
      </Layout>
    </RouteGuard>
  )
}