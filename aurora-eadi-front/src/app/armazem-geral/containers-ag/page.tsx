'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { ContainersAGPage } from '@/components/pages/armazem-geral/containers-ag/ContainersAGPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <ContainersAGPage />
    </ModuleRouteShell>
  );
}
