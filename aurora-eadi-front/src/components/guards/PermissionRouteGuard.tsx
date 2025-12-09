'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { AlertCircle, ShieldOff, ArrowLeft, Home } from 'lucide-react';
import { Logo } from '../ui/Logo';

interface PermissionRouteGuardProps {
  moduleRoute: string;
  requiredPermissions: string[];
  children: React.ReactNode;
  fallbackRoute?: string;
  isBlockPage?: boolean;
}

export function PermissionRouteGuard({
  moduleRoute,
  requiredPermissions,
  children,
  isBlockPage = true,
  fallbackRoute = '/modules',
}: PermissionRouteGuardProps) {
  const router = useRouter();

  const permissionChecks = requiredPermissions.map((permission) => {
    const { hasPermission, isLoading } = usePermission(moduleRoute, permission);
    return { permission, hasPermission, isLoading };
  });

  const isLoading = permissionChecks.some((check) => check.isLoading);
  const hasAllPermissions = permissionChecks.every((check) => check.hasPermission);
  const missingPermissions = permissionChecks
    .filter((check) => !check.hasPermission)
    .map((check) => check.permission);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Verificando permissões...</p>
          <p className="text-gray-400 text-sm mt-2">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (!hasAllPermissions && !isBlockPage) {
    return null;
  }

  if (!hasAllPermissions && isBlockPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">


          {/* Card principal */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-white/20 backdrop-blur-sm p-4">
                  <ShieldOff className="w-12 h-12" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center">Acesso Restrito</h1>
              <p className="text-center text-red-50 mt-2">
                Permissões insuficientes para esta funcionalidade
              </p>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-6">

              <div className="flex justify-center">
                <Logo src="/aurora-MANAUS_logo_principal.png" size="sm" />
              </div>

              <div className="text-center">
                <p className="text-gray-700">
                  Você não possui as permissões necessárias para acessar esta página.
                </p>
                <p className="text-gray-700">
                  Entre em contato com o administrador do sistema.
                </p>
              </div>

              {/* <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Permissões necessárias:</p>
                    <ul className="space-y-1">
                      {missingPermissions.map((p) => (
                        <li key={p} className="text-xs text-amber-800 font-mono">• {p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div> */}

              {/* <details className="group">
                <summary className="cursor-pointer text-sm text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Ver detalhes técnicos
                </summary>

                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  <p><strong>Módulo:</strong> {moduleRoute}</p>
                  <p><strong>Requer:</strong> {requiredPermissions.join(', ')}</p>
                </div>
              </details> */}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => router.push(fallbackRoute)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-700 hover:to-orange-600 shadow-md font-medium"
                >
                  <Home className="w-4 h-4" />
                  Ir para Módulos
                </button>

                <button
                  onClick={() => router.back()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              </div>

              <div className="text-center pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Precisa de ajuda? suporte@aurora.com
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">Sistema de Permissões Aurora EADI</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
