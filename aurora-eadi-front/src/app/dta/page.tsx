'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { DtaSelectionPage } from '@/components/pages/dta/DtaSelectionPage';

export default function DtaPage() {
  return (
    <ModuleRouteShell>
      <DtaSelectionPage />
    </ModuleRouteShell>
  );
}
