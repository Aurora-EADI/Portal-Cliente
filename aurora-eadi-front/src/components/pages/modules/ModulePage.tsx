'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { ModuleCard } from './ModuleCard';
import { Truck, FileText, ShoppingCart } from 'lucide-react';
import { UserRole } from '@/types/'

export function ModulesPage(){
  const router = useRouter();
  const { currentUser } = useAuthContext();

  const modules = [
    {
      icon: Truck,
      title: 'Logística & Operações',
      description: 'Monitoramento de frota e processos de importação/exportação.',
      route: '/logistics',
      roles: [UserRole.ADMIN]
    },
    {
      icon: ShoppingCart,
      title: 'Faturamento',
      description: 'Emissão de notas fiscais, relatório.',
      route: '/faturamento',
      roles: [UserRole.ADMIN]
    },
    {
      icon: FileText,
      title: 'Gestão de Documentos',
      description: 'Envio e organização de documentos.',
      route: '/documentos',
      roles: [UserRole.ADMIN, UserRole.SUPPLIER]
    },
     {
      icon: FileText,
      title: 'Permissões',
      description: 'Criar e permitir acesso aos usuários',
      route: '/permission',
      roles: [UserRole.ADMIN]
    }
  ];

  const handleModuleClick = (route: string) => {
    router.push(route);
  };

  const canAccessModule = (moduleRoles: UserRole[]) => {
    return currentUser && moduleRoles.includes(currentUser.role);
  };

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

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard
              key={module.route}
              icon={module.icon}
              title={module.title}
              description={module.description}
              onClick={() => handleModuleClick(module.route)}
              disabled={!canAccessModule(module.roles)}
            />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            © 2025 Aurora EADI - Matriz Manaus | Versão do Sistema: v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};