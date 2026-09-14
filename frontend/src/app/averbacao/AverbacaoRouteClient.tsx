'use client';

import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AverbacoesListPage } from '@/components/pages/averbacao/AverbacoesListPage';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

/**
 * Corpo da rota /averbacao.
 *
 * Vive separado da page porque ela precisa ser Server Component para o 404 da
 * flag sair com status de verdade, e este trecho depende de useAuthContext.
 *
 * RouteGuard nao serve aqui: ele libera CLIENTE, DESPACHANTE e TRANSPORTADORA
 * sem checar nada. Quem barra a TRANSPORTADORA e o RoleGuard.
 */
export function AverbacaoRouteClient() {
  const { currentUser } = useAuthContext();

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
        <AverbacoesListPage
          podeCriar={currentUser?.role === UserRole.DESPACHANTE}
        />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
