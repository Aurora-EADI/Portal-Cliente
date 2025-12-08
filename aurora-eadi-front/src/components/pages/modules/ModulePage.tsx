'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { ModuleCard } from './ModuleCard';
import { Truck, FileText, ShoppingCart, AlertCircle } from 'lucide-react';
import { modulesService, Module } from '@/services/modules/modules.service';

// Mapeamento de ícones (pode ser expandido conforme necessário)
const MODULE_ICONS: Record<string, any> = {
  'Logística & Operações': Truck,
  'Logística': Truck,
  'Faturamento': ShoppingCart,
  'Gestão de Documentos': FileText,
  'Permissões': FileText,
};

// Mapeamento de rotas (pode vir do backend futuramente)
const MODULE_ROUTES: Record<string, string> = {
  'Logística & Operações': '/logistics',
  'Logística': '/logistics',
  'Faturamento': '/faturamento',
  'Gestão de Documentos': '/documentos',
  'Permissões': '/permissoes',
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

  const handleModuleClick = (moduleName: string) => {
    const route = MODULE_ROUTES[moduleName];
    if (route) {
      router.push(route);
    }
  };

  const getModuleIcon = (moduleName: string) => {
    return MODULE_ICONS[moduleName] || FileText;
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
              const Icon = getModuleIcon(module.name);
              // ✅ Usa isEnabled do backend (não mais roles hardcoded)
              // Se o módulo está na lista, é porque isEnabled=true (filtrado na linha 54)

              return (
                <ModuleCard
                  key={module.id}
                  icon={Icon}
                  title={module.name}
                  description={module.description}
                  onClick={() => handleModuleClick(module.name)}
                  disabled={false} // Sempre habilitado pois já foi filtrado por isEnabled
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