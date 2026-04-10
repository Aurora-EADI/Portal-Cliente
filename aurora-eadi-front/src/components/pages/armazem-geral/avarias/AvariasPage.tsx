"use client";

import { PageHeader } from "@/components/ui/DataTable";
import { SearchBar } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function AvariasPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <PageHeader
        title="Gestão de Avarias"
        description="Acompanhamento e registro de avarias em containers e carga geral."
      />

      <div className="flex items-center justify-between">
        <SearchBar 
          placeholder="Buscar avaria ou referência..." 
          onSearch={() => {}} 
        />
        <Button variant="destructive">
          <AlertTriangle className="mr-2 h-4 w-4" /> Registrar Avaria
        </Button>
      </div>

      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Tabela de avarias em construção...
      </div>
    </div>
  );
}
