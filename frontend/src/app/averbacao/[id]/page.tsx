// Server Component de proposito: notFound() so devolve status 404 de verdade
// quando corre no servidor. Em 'use client' a tela de 404 aparece, mas a
// resposta sai 200. Por isso params vem com await, e nao com use().
import { notFound } from 'next/navigation';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AverbacaoDetalhePage } from '@/components/pages/averbacao/AverbacaoDetalhePage';
import { AVERBACAO_ATIVA } from '@/config/features';
import { UserRole } from '@/types';

export default async function AverbacaoDetalheRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Averbacao ainda nao entrou em operacao: para o produto a rota nao existe.
  if (!AVERBACAO_ATIVA) notFound();

  const { id } = await params;

  return (
    <RoleGuard
      allowedRoles={[
        UserRole.ADMIN,
        UserRole.EMPLOYEE,
        UserRole.CLIENTE,
        UserRole.DESPACHANTE,
      ]}
    >
      <ModuleRouteShell
        layout={{ maxWidth: 'full' }}
        header={{ pageTitle: 'Processo de Averbação' }}
      >
        <AverbacaoDetalhePage id={id} />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
