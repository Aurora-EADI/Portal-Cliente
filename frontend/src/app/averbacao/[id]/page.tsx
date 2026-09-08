'use client';

import { use } from 'react';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AverbacaoDetalhePage } from '@/components/pages/averbacao/AverbacaoDetalhePage';
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
        header={{ pageTitle: 'Processo de Averbação' }}
      >
        <AverbacaoDetalhePage id={id} />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
