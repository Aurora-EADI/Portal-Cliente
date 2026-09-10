'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import {
  Truck,
  FileText,
  ShoppingCart,
  Shield,
  Package,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Briefcase,
  Calendar,
  MessageSquare,
  Mail,
  Bell,
  LayoutDashboard,
  Layers,
  Wrench,
  Database,
  Calculator,
} from 'lucide-react';
import { userModuleAccessService } from '@/services/access/user-module-access.service';
import { ModuleAccess } from '@/types/access-control';
import { PageHeader, LauncherCard, EmptyState, ErrorState } from '@/components/orion/blocks';
import { Spinner } from '@/components/orion/ui';

// Map de ícones movido para escopo do módulo
// Evita recriação do objeto em cada render (~5-10ms de economia)
const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  FileText,
  ShoppingCart,
  Shield,
  Package,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Briefcase,
  Calendar,
  MessageSquare,
  Mail,
  Bell,
  LayoutDashboard,
  Layers,
  Wrench,
  Database,
  Calculator,
};

export function ModulesPage() {
  const router = useRouter();
  const { currentUser } = useAuthContext();

  const [modules, setModules] = useState<ModuleAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModules = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (currentUser?.id) {
          const data = await userModuleAccessService.getUserModulesWithAccessStatus(currentUser.id);
          const activeModules = data.modules.filter((module) => module.isEnabled === true);
          setModules(activeModules);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar módulos';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      loadModules();
    }
  }, [currentUser]);

  const handleModuleClick = (module: ModuleAccess) => {
    if (module.route) {
      router.push(module.route);
    }
  };

  const getModuleIcon = (iconName?: string): React.ComponentType<{ className?: string }> => {
    if (!iconName) return FileText;
    return ICON_COMPONENTS[iconName] || FileText;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" label="Carregando módulos..." className="text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Carregando módulos...</p>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col bg-background">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHeader
          title="Módulos do Sistema"
          description="Selecione o ambiente operacional que deseja acessar."
          eyebrow={currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}
          className="border-b border-border pb-6"
        />

        {error && (
          <ErrorState
            title="Erro ao carregar módulos"
            description={error}
          />
        )}

        {modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {modules.map((module) => {
              const Icon = getModuleIcon(module.icon);

              return (
                <LauncherCard
                  key={module.id}
                  icon={Icon}
                  title={module.name}
                  description={module.description ?? ''}
                  cta="Acessar módulo →"
                  onClick={() => handleModuleClick(module)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Nenhum módulo disponível"
            description="Não há módulos ativos no momento. Entre em contato com o administrador do sistema."
          />
        )}
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © 2025 Aurora EADI - Matriz Manaus | Versão do Sistema: v1.0.0
      </footer>
    </div>
  );
}

export default ModulesPage;
