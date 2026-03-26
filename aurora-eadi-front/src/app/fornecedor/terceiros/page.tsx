"use client"

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { WorkforceList } from '@/components/pages/fornecedor/terceiros/WorkforceList';

export default function SupplierWorkforcePage() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: '/fornecedor', requiredPermissions: ['FOR_VIEW_LIST'] }}>
      <WorkforceList />
    </ModuleRouteShell>
  );
}
