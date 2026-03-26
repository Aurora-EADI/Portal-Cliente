"use client"

import { RoleGuard } from '@/components/guards/RoleGuard';
import { WorkforceList } from '@/components/pages/fornecedor/terceiros/WorkforceList';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';

export default function DocumentosColaboradoresPage() {
  const { currentUser } = useAuthContext();
  const isSupplier = currentUser?.role === UserRole.SUPPLIER;

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER]} redirectTo="/documentos">
      <ModuleRouteShell>
        <WorkforceList
          companyId={isSupplier && currentUser?.companyId ? String(currentUser.companyId) : undefined}
          hideCompanyColumn={isSupplier}
          showAddButton={isSupplier}
          title={isSupplier ? 'Colaboradores' : 'Colaboradores de Terceiros'}
          description={
            isSupplier
              ? 'Visualize e gerencie os terceirizados da sua empresa.'
              : 'Visualize todos os colaboradores cadastrados por terceiros.'
          }
        />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
