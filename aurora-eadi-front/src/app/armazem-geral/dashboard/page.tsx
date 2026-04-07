'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { DashboardPage } from '@/components/pages/armazem-geral/dashboard/DashboardPage';

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/armazem-geral', requiredPermissions: [] }}>
      <DashboardPage />
    </ModuleRouteShell>
  );
}
