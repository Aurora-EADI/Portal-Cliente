"use client";

import { ModuleRouteShell } from "@/components/layout/ModuleRouteShell";
import { ContainerKanban } from "@/components/pages/dashboard/kanban/ContainerKanban";

export default function KanbanPage() {
  return (
    <ModuleRouteShell header={{ pageTitle: "Kanban de Containers" }} layout={{ maxWidth: "full" }}>
      <ContainerKanban />
    </ModuleRouteShell>
  );
}
