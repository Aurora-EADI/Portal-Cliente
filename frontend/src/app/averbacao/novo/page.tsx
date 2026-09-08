'use client';

import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { NovaAverbacaoPage } from '@/components/pages/averbacao/NovaAverbacaoPage';
import { UserRole } from '@/types';

// So o Despachante abre averbacao, e apenas para importador com procuracao
// APROVADA — regra que o backend revalida (403).
export default function NovaAverbacaoRoute() {
  return (
    <RoleGuard allowedRoles={[UserRole.DESPACHANTE]}>
      <ModuleRouteShell
        layout={{ maxWidth: 'full' }}
        header={{ pageTitle: 'Nova Averbação' }}
      >
        <NovaAverbacaoPage />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
