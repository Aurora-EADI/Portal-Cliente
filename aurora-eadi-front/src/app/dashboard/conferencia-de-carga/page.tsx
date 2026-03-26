"use client";

import { ModuleRouteShell } from "@/components/layout/ModuleRouteShell";
import { ConferenciaCargaKanban } from "@/components/pages/dashboard/conferencia-carga/ConferenciaCargaKanban";

export default function ConferenciaDeCargaPage() {
  return (
    <ModuleRouteShell header={{ pageTitle: "Conferencia de Carga" }} layout={{ maxWidth: "full" }}>
      <ConferenciaCargaKanban />
    </ModuleRouteShell>
  );
}
