"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { PermissionManagerPage } from '@/components/pages/permissoes/gestao/PermissionManagerPage'

export default function PermissoesGestaoPage() {
  return (
    <RouteGuard route="/permissoes">
      <Layout>
        <PermissionManagerPage />
      </Layout>
    </RouteGuard>
  )
}