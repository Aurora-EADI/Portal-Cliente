import { useMemo, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { NavItem, getNavigationByPathAndRole, setDynamicNavigationContexts } from '@/config/navigation';
import { useModuleAccess } from './useModuleAccess';
import { useModuleAccessContext } from '@/context/ModuleAccessContext';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { buildNavigationContexts } from '@/config/navigation/buildNavigation';

/**
 * Hook que retorna os itens de navegação filtrados pelas permissões e role do usuário.
 * Gera navegação dinâmica a partir dos dados do banco quando disponível,
 * com fallback para a navegação estática.
 * @returns Array de NavItems que o usuário tem permissão para acessar
 */
export function useNavigationWithPermissions(): NavItem[] {
  const pathname = usePathname();
  const { currentUser } = useAuthContext();
  const { modules: allModules, isLoading: modulesLoading } = useModuleAccessContext();
  const dynamicBuiltRef = useRef(false);

  // Extrai a rota base do módulo atual (ex: /faturamento/cutoff -> /faturamento)
  const moduleRoute = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length > 0 ? `/${parts[0]}` : '/modules';
  }, [pathname]);

  // Busca dados do módulo e permissões
  const { module, isLoading } = useModuleAccess(moduleRoute);

  // Constrói navegação dinâmica a partir dos módulos do banco
  useEffect(() => {
    if (dynamicBuiltRef.current) return;
    if (!modulesLoading && allModules && allModules.length > 0) {
      const dynamicContexts = buildNavigationContexts(allModules);
      if (dynamicContexts.length > 0) {
        setDynamicNavigationContexts(dynamicContexts);
        dynamicBuiltRef.current = true;
      }
    }
  }, [allModules, modulesLoading]);

  // Obtém itens de navegação filtrados pelo role do usuário
  const userRole = currentUser?.role ?? UserRole.SUPPLIER;
  const allNavigationItems = getNavigationByPathAndRole(pathname, userRole);

  // Filtra itens baseado nas permissões do usuário
  const filteredItems = useMemo(() => {
    if (isLoading || !module) {
      const filterRolesOnly = (item: NavItem): NavItem | null => {
        if (item.requiredPermissions?.length) return null;
        if (item.requiredRoles?.length && !item.requiredRoles.includes(userRole)) return null;
        if (!item.children?.length) return item;
        const children = item.children.map(filterRolesOnly).filter((c): c is NavItem => c !== null);
        if (item.isGroup && children.length === 0) return null;
        return { ...item, children: children.length > 0 ? children : undefined };
      };
      return allNavigationItems.map(filterRolesOnly).filter((i): i is NavItem => i !== null);
    }

    // Obtém todas as permissões ativas do usuário neste módulo
    const userPermissions = new Set<string>();
    module.activities?.forEach((activity) => {
      // Verifica se a atividade está ativa e tem permissões vinculadas
      if (activity.isActive && activity.permissions) {
        activity.permissions.forEach((permission: any) => {
          // A permissão pode vir como string ou como objeto { key: string, ... }
          const permissionKey = typeof permission === 'string' ? permission : permission.key;
          if (permissionKey) {
            userPermissions.add(permissionKey);
          }
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
     * Função helper que verifica se o role do usuário está na lista de roles permitidos
     */
    const hasRequiredRoles = (item: NavItem): boolean => {
      if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
      return item.requiredRoles.includes(userRole);
    };

    // Conjunto de rotas habilitadas no editor de módulos.
    // null → nunca configurado → exibe tudo; Set vazio → todas desmarcadas → nada exibe.
    const enabledRoutes: Set<string> | null = module.sharedItems != null
      ? new Set(module.sharedItems.map((item) => item.targetRoute))
      : null;

    /**
     * Verifica se uma rota de sub-página está habilitada pelo editor de módulos.
     * Itens sem path, raízes de grupo ou paths de outros módulos não são filtrados.
     */
    const isSubPageEnabled = (path?: string): boolean => {
      if (!enabledRoutes || !path) return true;
      const isSubPage = path.split('/').filter(Boolean).length > 1;
      if (!isSubPage) return true;
      return enabledRoutes.has(path);
    };

    /**
     * Função recursiva que filtra itens e seus children baseado em permissões e roles
     */
    const filterItemWithChildren = (item: NavItem): NavItem | null => {
      // Verifica role e permissão
      if (!hasRequiredRoles(item) || !hasRequiredPermissions(item)) {
        return null;
      }

      // Verifica se a sub-página está habilitada no editor de módulos
      if (!isSubPageEnabled(item.path)) {
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
