'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { PatioPage } from '@/components/pages/armazem-geral/patio/PatioPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <PatioPage />
    </ModuleRouteShell>
  );
}
