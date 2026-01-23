"use client"

import { Layout } from '@/components/layout/Layout'
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard'
import { Header } from '@/components/layout/Header'
import { CustomerList } from '@/components/pages/clientes/listaClientes/CustomerList'

export default function CreateCustomer () {
  return (
    // <PermissionRouteGuard
    //   moduleRoute="/cliente"
    //   requiredPermissions={['']}
    // >
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <CustomerList />
        </Layout>
      </div>
    // </PermissionRouteGuard>
  )
}