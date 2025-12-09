'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  moduleRoute: string;
  permissionKey: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showLoading?: boolean;
}

/**
 * Componente que condiciona a renderização baseado em permissão específica
 * @param moduleRoute - Rota do módulo (ex: /faturamento)
 * @param permissionKey - Chave da permissão (ex: FAT_VIEW_CUTOFF)
 * @param fallback - Componente a exibir se não tiver permissão (padrão: null)
 * @param showLoading - Se deve mostrar loading (padrão: false)
 * @param children - Conteúdo a renderizar se tiver permissão
 *
 * @example
 * <PermissionGuard
 *   moduleRoute="/faturamento"
 *   permissionKey="FAT_VIEW_CUTOFF"
 *   fallback={<p>Você não tem acesso a esta funcionalidade</p>}
 * >
 *   <CutoffReportButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  moduleRoute,
  permissionKey,
  fallback = null,
  showLoading = false,
  children,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermission(moduleRoute, permissionKey);

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
