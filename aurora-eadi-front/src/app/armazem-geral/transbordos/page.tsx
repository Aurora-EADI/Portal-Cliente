'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { TransbordosPage } from '@/components/pages/armazem-geral/transbordos/TransbordosPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <TransbordosPage />
    </ModuleRouteShell>
  );
}
