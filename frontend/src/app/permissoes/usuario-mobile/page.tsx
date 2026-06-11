"use client"

import { Layout } from '@/components/layout/Layout'
import { RouteGuard } from '@/components/guards/RouteGuard'
import { MobileUserRegistryPage } from '@/components/pages/permissoes/usuario-mobile/MobileUserRegistryPage'
import Header from '@/components/layout/Header'

export default function PermissoesUsuarioMobilePage() {
  return (
    <RouteGuard route="/permissoes">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <MobileUserRegistryPage />
        </Layout>
      </div>
    </RouteGuard>
  )
}
