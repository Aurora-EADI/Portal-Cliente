import { useMemo } from 'react';
import { useModuleAccessContext } from '@/context/ModuleAccessContext';
import { ModuleAccess } from '@/types/access-control';

interface ModuleAccessResult {
  isLoading: boolean;
  hasAccess: boolean;
  module: ModuleAccess | null;
  error: string | null;
}

/**
 * Hook otimizado para verificar acesso a um módulo específico
 * Usa contexto cacheado em vez de fazer chamadas API repetidas
 * @param route - Rota do módulo (ex: /permissoes)
 * @returns Estado de acesso ao módulo
 */
export function useModuleAccess(route: string): ModuleAccessResult {
  const { modules, isLoading, error, getModuleByRoute } = useModuleAccessContext();

  // Calcula acesso de forma memoizada (só recalcula se modules ou route mudarem)
  const result = useMemo(() => {
    const module = getModuleByRoute(route);

    return {
      isLoading,
      hasAccess: module !== null,
      module,
      error,
    };
  }, [modules, route, isLoading, error, getModuleByRoute]);

  return result;
}
