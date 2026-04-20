'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { ConferentesPage } from '@/components/pages/armazem-geral/conferentes/ConferentesPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <ConferentesPage />
    </ModuleRouteShell>
  );
}
