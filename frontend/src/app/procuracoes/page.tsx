'use client';

import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { EmConstrucao } from '@/components/pages/averbacao/EmConstrucao';
import { UserRole } from '@/types';

// Procuracao e a autorizacao de um Cliente para o Despachante operar em seu
// nome. So faz sentido para o Despachante.
export default function ProcuracoesRoute() {
  return (
    <RoleGuard allowedRoles={[UserRole.DESPACHANTE]}>
      <ModuleRouteShell
        layout={{ maxWidth: 'full' }}
        header={{ pageTitle: 'Procurações' }}
      >
        <EmConstrucao
          titulo="Procurações"
          descricao="Lista por cliente, envio e reenvio de PDF e motivo de recusa chegam na Fase 2."
        />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
