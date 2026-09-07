'use client';

import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { EmConstrucao } from '@/components/pages/averbacao/EmConstrucao';
import { UserRole } from '@/types';

// RouteGuard nao serve aqui: ele libera CLIENTE, DESPACHANTE e TRANSPORTADORA
// sem checar nada. Quem barra a TRANSPORTADORA e o RoleGuard.
export default function AverbacaoRoute() {
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
        header={{ pageTitle: 'Averbação Aduaneira' }}
      >
        <EmConstrucao
          titulo="Processos de Averbação"
          descricao="A lista de processos chega na Fase 3. Por ora esta rota existe para fixar a navegação e as permissões."
        />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
