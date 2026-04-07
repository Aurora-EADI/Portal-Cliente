"use client";

import { ModuleRouteShell } from "@/components/layout/ModuleRouteShell";
import { ReportsDashboard } from "@/components/pages/armazem-geral/relatorios/ReportsDashboard";

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: "/armazem-geral", requiredPermissions: [] }}>
      <ReportsDashboard />
    </ModuleRouteShell>
  );
}
