"use client";

import { ModuleRouteShell } from "@/components/layout/ModuleRouteShell";
import { ArmazemGeralHomePage } from "@/components/pages/armazem-geral/ArmazemGeralHomePage";

export default function ArmazemGeralRoute() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: "/armazem-geral", requiredPermissions: [] }}>
      <ArmazemGeralHomePage />
    </ModuleRouteShell>
  );
}

