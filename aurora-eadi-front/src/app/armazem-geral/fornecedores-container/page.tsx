'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { ContainerSuppliersPage } from '@/components/pages/armazem-geral/containers-ag/ContainerSuppliersPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <ContainerSuppliersPage />
    </ModuleRouteShell>
  );
}
