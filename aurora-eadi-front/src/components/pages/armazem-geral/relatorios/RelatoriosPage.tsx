"use client";

import { PageHeader } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export function RelatoriosPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <PageHeader
        title="Relatórios - Armazém Geral"
        description="Extração de relatórios analíticos e em PDF/Excel."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <ClipboardList className="h-4 w-4" />
              Relatório de Posição de Pátio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Exportar todas as unidades e suas localizações do Armazém.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
