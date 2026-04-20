"use client";

import { ModuleRouteShell } from "@/components/layout/ModuleRouteShell";
import { ReportsMovement } from "@/components/pages/armazem-geral/relatorios/ReportsMovement";

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: "/armazem-geral", requiredPermissions: [] }}>
      <ReportsMovement />
    </ModuleRouteShell>
  );
}
