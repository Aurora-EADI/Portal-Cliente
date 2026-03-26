import { ModuleRouteShell } from "@/components/layout/ModuleRouteShell";
import { DocumentTypesManager } from "@/components/pages/documentos/DocumentTypesManager";

export default function DocumentTypesPage() {
  return (
    <ModuleRouteShell>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Gerenciar Tipos de Documentos
          </h1>
          <p className="text-gray-500">
            Cadastre e edite os tipos de documentos exigidos no sistema.
          </p>
        </div>
        <DocumentTypesManager />
      </div>
    </ModuleRouteShell>
  );
}
