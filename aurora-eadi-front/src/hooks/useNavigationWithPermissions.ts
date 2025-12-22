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

    /**
     * Função helper que verifica se um item tem as permissões necessárias
     */
    const hasRequiredPermissions = (item: NavItem): boolean => {
      // Se não requer permissões, sempre mostra
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true;
      }
      // Verifica se usuário tem TODAS as permissões necessárias
      return item.requiredPermissions.every((requiredPerm) =>
        userPermissions.has(requiredPerm)
      );
    };

    /**
     * Função recursiva que filtra itens e seus children baseado em permissões
     */
    const filterItemWithChildren = (item: NavItem): NavItem | null => {
      // Verifica se o item atual tem permissão
      if (!hasRequiredPermissions(item)) {
        return null;
      }

      // Se o item não tem children, retorna o item
      if (!item.children || item.children.length === 0) {
        return item;
      }

      // Filtra recursivamente os children
      const filteredChildren = item.children
        .map(child => filterItemWithChildren(child))
        .filter((child): child is NavItem => child !== null);

      // Se o item é um grupo e não tem children visíveis após filtrar, não mostra o grupo
      if (item.isGroup && filteredChildren.length === 0) {
        return null;
      }

      // Retorna o item com os children filtrados
      return {
        ...item,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      };
    };

    // Filtra todos os itens de navegação recursivamente
    return allNavigationItems
      .map(item => filterItemWithChildren(item))
      .filter((item): item is NavItem => item !== null);
  }, [allNavigationItems, module, isLoading, module?.activities]);

  return filteredItems;
}
