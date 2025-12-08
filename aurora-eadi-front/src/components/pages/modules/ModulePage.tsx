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
} from 'lucide-react';
import { modulesService, Module } from '@/services/modules/modules.service';

// 🆕 Mapeamento de string (do backend) para componente React de ícone
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
};

export function ModulesPage() {
  const router = useRouter();
  const { currentUser } = useAuthContext();
  
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega os módulos do backend
  useEffect(() => {
    const loadModules = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await modulesService.getAll(currentUser!.id);

        console.log('Módulos carregados:', data);
        
        // ✅ Filtra apenas módulos ativos (active = true)
        const activeModules = data.modules.filter(module => module.isEnabled === true);
        
        setModules(activeModules);
      } catch (err: any) {
        console.error('Erro ao carregar módulos:', err);
        setError(err.message || 'Erro ao carregar módulos');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      loadModules();
    }
  }, [currentUser]);

  // ✅ NOVA IMPLEMENTAÇÃO - Usa rota do backend
  const handleModuleClick = (module: Module) => {
    if (module.route) {
      router.push(module.route);
    } else {
      console.warn(`Módulo ${module.name} não tem rota configurada`);
    }
  };

  // ✅ NOVA IMPLEMENTAÇÃO - Usa ícone do backend
  const getModuleIcon = (iconName?: string): React.ElementType => {
    if (!iconName) return FileText; // Ícone padrão
    return ICON_COMPONENTS[iconName] || FileText;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Módulos do Sistema
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Selecione o ambiente operacional que deseja acessar.
          </p>
        </div>

        {/* Data Atual */}
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-red-800 font-medium mb-1">Erro ao carregar módulos</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Módulos - Apenas Ativos */}
        {modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = getModuleIcon(module.icon); // 🆕 Ícone dinâmico do backend

              return (
                <ModuleCard
                  key={module.id}
                  icon={Icon}                            // 🆕 Do backend
                  title={module.name}                    // Do backend
                  description={module.description}        // Do backend
                  onClick={() => handleModuleClick(module)} // 🆕 Usa route do backend
                  disabled={false}                       // Sempre habilitado (já filtrado)
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

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            © 2025 Aurora EADI - Matriz Manaus | Versão do Sistema: v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}