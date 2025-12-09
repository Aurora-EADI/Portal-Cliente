'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { AlertCircle, ShieldOff, ArrowLeft } from 'lucide-react';
import { Logo } from '../ui/Logo';

interface RouteGuardProps {
  route: string;
  children: React.ReactNode;
}

/**
 * Componente que protege rotas verificando se o usuário tem acesso ao módulo
 * @param route - Rota do módulo (ex: /permissoes)
 * @param children - Conteúdo da página a ser renderizado se tiver acesso
 */
export function RouteGuard({ route, children }: RouteGuardProps) {
  const router = useRouter();
  const { isLoading, hasAccess, module, error } = useModuleAccess(route);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Erro ao Verificar Permissões
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/modules')}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Módulos
          </button>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <Logo src="/aurora-MANAUS_logo_principal.png" size="sm" />
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <ShieldOff className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Acesso Negado
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Você não tem permissão para acessar esta página. Entre em contato com o administrador do sistema para solicitar acesso.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
            <p className="text-xs text-yellow-800">
              <strong>Rota solicitada:</strong> {route}
            </p>
          </div>
          <button
            onClick={() => router.push('/modules')}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Módulos
          </button>
        </div>
      </div>
    );
  }

  // Has access - render children
  return <>{children}</>;
}
