"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { CustomerList } from '@/components/pages/clientes/listaClientes/CustomerList'

export default function ClienteListaPage() {
  return (
    <ModuleRouteShell>
      <CustomerList />
    </ModuleRouteShell>
  )
}
