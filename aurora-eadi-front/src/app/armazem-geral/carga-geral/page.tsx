'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { CargaGeralPage } from '@/components/pages/armazem-geral/carga-geral/CargaGeralPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <CargaGeralPage />
    </ModuleRouteShell>
  );
}
