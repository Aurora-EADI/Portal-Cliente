"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { ServiceList } from '@/components/pages/servicos/listaServicos/ServiceList'

export default function ServicosPage() {
  return (
    <ModuleRouteShell>
      <ServiceList />
    </ModuleRouteShell>
  )
}
