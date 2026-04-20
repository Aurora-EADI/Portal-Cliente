'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AuditoriaPage } from '@/components/pages/armazem-geral/auditoria/AuditoriaPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <AuditoriaPage />
    </ModuleRouteShell>
  );
}
