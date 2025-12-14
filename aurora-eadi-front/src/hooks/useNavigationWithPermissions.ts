import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { NavItem, getNavigationByPathAndRole } from '@/config/navigation';
import { useModuleAccess } from './useModuleAccess';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

/**
 * Hook que retorna os itens de navegação filtrados pelas permissões e role do usuário
 * @returns Array de NavItems que o usuário tem permissão para acessar
 */
export function useNavigationWithPermissions(): NavItem[] {
  const pathname = usePathname();
  const { currentUser } = useAuthContext();

  // Extrai a rota base do módulo atual (ex: /faturamento/cutoff -> /faturamento)
  const moduleRoute = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length > 0 ? `/${parts[0]}` : '/modules';
  }, [pathname]);

  // Busca dados do módulo e permissões
  const { module, isLoading } = useModuleAccess(moduleRoute);

  // Obtém itens de navegação filtrados pelo role do usuário
  const userRole = currentUser?.role ?? UserRole.SUPPLIER;
  const allNavigationItems = getNavigationByPathAndRole(pathname, userRole);

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
