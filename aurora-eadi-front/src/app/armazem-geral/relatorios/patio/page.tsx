"use client";

import { ModuleRouteShell } from "@/components/layout/ModuleRouteShell";
import { ReportsPatio } from "@/components/pages/armazem-geral/relatorios/ReportsPatio";

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: "/armazem-geral", requiredPermissions: [] }}>
      <ReportsPatio />
    </ModuleRouteShell>
  );
}
