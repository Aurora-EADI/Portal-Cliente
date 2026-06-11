'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { ModuleCard } from './ModuleCard';
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
  AlertCircle,
  Calculator,
} from 'lucide-react';
import { userModuleAccessService } from '@/services/access/user-module-access.service';
import { ModuleAccess } from '@/types/access-control';

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

const MOCK_MODULES_PAGE: ModuleAccess[] = [
  {
    id: 1, name: 'Agendamento FCL', description: 'Portal de Agendamento de Containers',
    isEnabled: true, userModuleAccessId: 1,
    activities: [], totalActivities: 0, activeActivities: 0,
    route: '/agendamento', icon: 'Calendar', sharedItems: [],
  },
];

// 🚀 OTIMIZAÇÃO: Map de ícones movido para escopo do módulo
// Evita recriação do objeto em cada render (~5-10ms de economia)
const ICON_COMPONENTS: Record<string, React.ElementType> = {
  'Truck': Truck,
  'FileText': FileText,
  'ShoppingCart': ShoppingCart,
  'Shield': Shield,
  'Package': Package,
  'Users': Users,
  'BarChart3': BarChart3,
  'Settings': Settings,
  'CreditCard': CreditCard,
  'Briefcase': Briefcase,
  'Calendar': Calendar,
  'MessageSquare': MessageSquare,
  'Mail': Mail,
  'Bell': Bell,
  'LayoutDashboard': LayoutDashboard,
  'Layers': Layers,
  'Wrench': Wrench,
  'Database': Database,
  'Calculator': Calculator,
};

export function ModulesPage() {
  const router = useRouter();
  const { currentUser } = useAuthContext();

  const [modules, setModules] = useState<ModuleAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModules = async () => {
      if (MOCK_MODE) {
        setModules(MOCK_MODULES_PAGE);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const data = await userModuleAccessService.getUserModulesWithAccessStatus(currentUser!.id);
        const activeModules = data.modules.filter(module => module.isEnabled === true);
        setModules(activeModules);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar módulos');
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

  const getModuleIcon = (iconName?: string): React.ElementType => {
    if (!iconName) return FileText;
    return ICON_COMPONENTS[iconName] || FileText;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-primary-400 animate-ping opacity-20 mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium">Carregando módulos...</p>
          <p className="text-gray-500 text-sm mt-1">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Fixo */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              Módulos do Sistema
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Selecione o ambiente operacional que deseja acessar.
            </p>
          </div>

          {/* Data Atual */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </header>

      {/* Área de Scroll Principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Erro */}
          {error && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-red-800 font-medium mb-1">Erro ao carregar módulos</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Grid de Módulos */}
          {modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                  {modules.map((module) => {

                    const Icon = getModuleIcon(module.icon);

                    return (
                      <ModuleCard
                        key={module.id}
                        icon={Icon}
                        title={module.name}
                        description={module.description}
                        onClick={() => handleModuleClick(module)}
                        disabled={false}
                      />
                    );
                  })}
                </div>
              ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum módulo disponível
              </h3>
              <p className="text-gray-600">
                Não há módulos ativos no momento. Entre em contato com o administrador do sistema.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-t border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-center text-gray-400">
            © 2025 Aurora EADI - Matriz Manaus | Versão do Sistema: v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
