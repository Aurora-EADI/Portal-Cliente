import { Home } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { NavigationContext, NavItem } from './types';
import { ModuleAccess } from '@/types/access-control';
import { getRouteByPath } from '@/config/routes';
import { navigationContextMap } from './index';

/**
 * Resolve um nome de ícone (string) para o componente React correspondente do lucide-react.
 * Lucide icons são exportados como ForwardRefExoticComponent (typeof === 'object'),
 * então verificamos pela propriedade $$typeof que identifica componentes React válidos.
 */
function resolveIcon(iconName?: string): React.ComponentType<{ size?: number }> | undefined {
  if (!iconName) return undefined;
  const icon = (LucideIcons as Record<string, unknown>)[iconName];
  if (icon && (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon))) {
    return icon as React.ComponentType<{ size?: number }>;
  }
  return undefined;
}

/**
 * Busca um NavItem na navegação estática por path, percorrendo items e children.
 */
function findStaticNavItem(basePath: string, targetPath: string): NavItem | undefined {
  const staticContext = navigationContextMap.get(basePath);
  if (!staticContext) return undefined;

  for (const item of staticContext.items) {
    if (item.path === targetPath) return item;
    if (item.children) {
      const child = item.children.find((c) => c.path === targetPath);
      if (child) return child;
    }
  }
  return undefined;
}

/**
 * Constrói os contextos de navegação dinamicamente a partir dos dados de acesso do usuário.
 *
 * Para cada módulo habilitado que possua rota e sharedItems:
 * 1. Busca a navegação estática como base (labels, ícones, permissões)
 * 2. Enriquece com dados do banco (sharedItems definem quais sub-páginas mostrar)
 * 3. Prioridade: navegação estática > registry > banco > fallback
 *
 * Módulos sem sharedItems são ignorados para usar o fallback estático.
 */
export function buildNavigationContexts(
  modules: ModuleAccess[],
): NavigationContext[] {
  const contexts: NavigationContext[] = [];

  for (const mod of modules) {
    // Pula módulos sem rota ou desabilitados
    if (!mod.route || !mod.isEnabled) continue;

    // Pula módulos sem sub-páginas configuradas — usa fallback estático
    if (!mod.sharedItems || mod.sharedItems.length === 0) continue;

    // Resolve ícone e label do módulo
    // Prioridade: navegação estática > registry > banco > fallback
    const registryRoute = getRouteByPath(mod.route);
    const staticContext = navigationContextMap.get(mod.route);
    const staticGroupItem = staticContext?.items.find((i) => i.isGroup);

    const moduleIcon = staticGroupItem?.icon
      || resolveIcon(mod.icon)
      || resolveIcon(registryRoute?.icon)
      || Home;

    const moduleLabel = registryRoute?.label || mod.name;

    // Home item é sempre o primeiro
    const homeItem: NavItem = {
      label: 'Home',
      icon: Home,
      path: '/modules',
    };

    // Constrói children a partir dos sharedItems (sub-páginas do módulo)
    // Para cada item, busca na navegação estática para preservar ícone, permissões e roles
    const children: NavItem[] = mod.sharedItems
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((item) => {
        const staticItem = findStaticNavItem(mod.route!, item.targetRoute);
        const registryItem = getRouteByPath(item.targetRoute);

        const itemIcon = staticItem?.icon
          || resolveIcon(item.icon)
          || resolveIcon(registryItem?.icon)
          || moduleIcon;

        return {
          label: staticItem?.label || item.label,
          icon: itemIcon,
          path: item.targetRoute,
          ...(staticItem?.requiredPermissions && { requiredPermissions: staticItem.requiredPermissions }),
          ...(staticItem?.requiredRoles && { requiredRoles: staticItem.requiredRoles }),
        };
      });

    // Inclui children da navegação estática que não foram cobertos pelos sharedItems
    // Isso garante que novas rotas adicionadas ao static nav apareçam automaticamente
    if (staticGroupItem?.children) {
      for (const staticChild of staticGroupItem.children) {
        if (!children.some((c) => c.path === staticChild.path)) {
          children.push(staticChild);
        }
      }
    }

    const moduleItem: NavItem = {
      label: moduleLabel,
      icon: moduleIcon,
      path: mod.route,
      isGroup: true,
      children,
    };

    // Coleta items extras da navegação estática (ex: CLIENTE_ITEM)
    // que não são Home nem o grupo principal
    const extraItems: NavItem[] = staticContext
      ? staticContext.items.filter((i) => i.path !== '/modules' && !i.isGroup)
      : [];

    // Preserva allowedRoles da navegação estática
    const context: NavigationContext = {
      basePath: mod.route,
      items: [homeItem, moduleItem, ...extraItems],
      ...(staticContext?.allowedRoles && { allowedRoles: staticContext.allowedRoles }),
    };

    contexts.push(context);
  }

  return contexts;
}
