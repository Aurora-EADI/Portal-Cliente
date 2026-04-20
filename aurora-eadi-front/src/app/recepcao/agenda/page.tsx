'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AgendaPage } from '@/components/pages/recepcao/AgendaPage';

export default function AgendaRoute() {
  return (
    <ModuleRouteShell wrapperClassName="h-screen flex flex-col overflow-hidden bg-gray-50/50">
      <AgendaPage />
    </ModuleRouteShell>
  );
}
