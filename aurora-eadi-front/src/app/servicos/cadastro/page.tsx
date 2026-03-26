"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell'
import { RegisterService } from '@/components/pages/servicos/RegisterService'

export default function CadastroServico() {
  return (
    <ModuleRouteShell>
      <RegisterService />
    </ModuleRouteShell>
  )
}
