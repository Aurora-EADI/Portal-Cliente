// Server Component de proposito: notFound() so devolve status 404 de verdade
// quando corre no servidor. Em 'use client' a tela de 404 aparece, mas a
// resposta sai 200. Nao usa hook nenhum — os filhos e que sao client.
import { notFound } from 'next/navigation';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { ProcuracoesPage } from '@/components/pages/procuracoes/ProcuracoesPage';
import { AVERBACAO_ATIVA } from '@/config/features';
import { UserRole } from '@/types';

// Procuracao e a autorizacao de um Cliente para o Despachante operar em seu
// nome. So faz sentido para o Despachante.
export default function ProcuracoesRoute() {
  // Procuracao entra junto com a averbacao: sozinha ela nao tem proposito.
  if (!AVERBACAO_ATIVA) notFound();

  return (
    <RoleGuard allowedRoles={[UserRole.DESPACHANTE]}>
      <ModuleRouteShell
        layout={{ maxWidth: 'full' }}
        header={{ pageTitle: 'Procurações' }}
      >
        <ProcuracoesPage />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
