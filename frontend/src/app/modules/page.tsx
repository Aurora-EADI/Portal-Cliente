// app/modules/page.tsx
'use client'

import { ModulesPage } from '@/components/pages/modules/ModulePage'
import { Header } from '@/components/layout/Header'

/**
 * 🚀 OTIMIZAÇÃO: Removida verificação duplicada de autenticação
 * O ProtectedRoute (em providers.tsx) já faz essa verificação
 */
export default function Modules() {
  return (
    <>
      <Header />
      <ModulesPage />
    </>
  );
}