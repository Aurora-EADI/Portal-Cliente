'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { ContainersPage } from '@/components/pages/armazem-geral/containers/ContainersPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <ContainersPage />
    </ModuleRouteShell>
  );
}
