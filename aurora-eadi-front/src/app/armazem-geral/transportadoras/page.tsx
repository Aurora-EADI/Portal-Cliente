'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { TransportadorasPage } from '@/components/pages/armazem-geral/transportadoras/TransportadorasPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <TransportadorasPage />
    </ModuleRouteShell>
  );
}
