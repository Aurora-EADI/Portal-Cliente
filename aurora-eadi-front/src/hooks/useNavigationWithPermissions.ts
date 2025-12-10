import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { NavItem, getNavigationByPath } from '@/config/navigation';
import { useModuleAccess } from './useModuleAccess';

/**
 * Hook que retorna os itens de navegação filtrados pelas permissões do usuário
 * @returns Array de NavItems que o usuário tem permissão para acessar
 */
export function useNavigationWithPermissions(): NavItem[] {
  const pathname = usePathname();

  // Extrai a rota base do módulo atual (ex: /faturamento/cutoff -> /faturamento)
  const moduleRoute = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);  
    return parts.length > 0 ? `/${parts[0]}` : '/modules';
  }, [pathname]);

  // Busca dados do módulo e permissões
  const { module, isLoading } = useModuleAccess(moduleRoute);

  // Obtém todos os itens de navegação para o path atual
  const allNavigationItems = getNavigationByPath(pathname);

  // Filtra itens baseado nas permissões do usuário
  const filteredItems = useMemo(() => {
    if (isLoading || !module) {
      // Durante o carregamento ou sem módulo, retorna apenas Home
      return allNavigationItems.filter(item => !item.requiredPermissions);
    }

    // Obtém todas as permissões ativas do usuário neste módulo
    const userPermissions = new Set<string>();
    module.activities?.forEach((activity) => {
      if (activity.isActive && activity.permissions) {
        activity.permissions.forEach((permission) => {
          userPermissions.add(permission);
        });
      }
    });

    // Filtra itens de navegação
    return allNavigationItems.filter((item) => {
      // Se não requer permissões, sempre mostra
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true;
      }

      // Verifica se usuário tem TODAS as permissões necessárias
      return item.requiredPermissions.every((requiredPerm) =>
        userPermissions.has(requiredPerm)
      );
    });
  }, [allNavigationItems, module, isLoading]);

  return filteredItems;
}
