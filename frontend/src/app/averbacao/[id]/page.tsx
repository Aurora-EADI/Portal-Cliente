'use client';

import { use } from 'react';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { EmConstrucao } from '@/components/pages/averbacao/EmConstrucao';
import { UserRole } from '@/types';

export default function AverbacaoDetalheRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

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
        header={{ pageTitle: 'Detalhe da Averbação' }}
      >
        <EmConstrucao
          titulo={`Averbação ${id}`}
          descricao="Status por documento, motivo de rejeição, substituição e histórico chegam na Fase 3."
        />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
