'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigationWithPermissions } from '@/hooks/useNavigationWithPermissions';
import type { NavItem } from '@/config/navigation';
import { UserProfileModal } from './UserProfileModal';
import {
  Sidebar as OrionSidebar,
  type SidebarModule,
  type NavigationItem,
  type RenderLink,
} from '@/components/orion/blocks';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/orion/ui';
import { LogOut, User, Settings, Calendar, LayoutGrid } from 'lucide-react';

interface SidebarComponentProps {
  mobile?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  collapsible?: boolean;
}

export const Sidebar: React.FC<SidebarComponentProps> = ({
  mobile = false,
  onClose,
  collapsed: controlledCollapsed,
  onCollapsedChange: controlledOnCollapsedChange,
  collapsible: controlledCollapsible,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, logoutUser } = useAuthContext();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const onCollapsedChange = controlledOnCollapsedChange ?? setInternalCollapsed;
  const collapsible = controlledCollapsible ?? !mobile;

  const navigationItems = useNavigationWithPermissions();

  const handleLogout = useCallback(() => {
    logoutUser();
    router.push('/');
  }, [logoutUser, router]);

  const isActive = useCallback(
    (path: string) => {
      const [baseUrl, query] = path.split('?');
      if (pathname !== baseUrl) return false;

      if (query) {
        const params = new URLSearchParams(query);
        for (const [key, value] of params.entries()) {
          if (searchParams.get(key) !== value) return false;
        }
        return true;
      }

      return searchParams.toString() === '';
    },
    [pathname, searchParams]
  );

  // Mapeia árvore de NavItem para NavigationItem canônico do Orion
  const navigation: NavigationItem[] = useMemo(() => {
    const mapItem = (item: NavItem): NavigationItem => ({
      id: item.path || item.label,
      label: item.label,
      href: item.isGroup ? undefined : item.path,
      icon: item.icon as any,
      children: item.children?.map(mapItem),
      meta: item.isGroup ? { group: true } : undefined,
    });

    // Se houver apenas 1 grupo raiz e ele tiver filhos, achata para evitar título de grupo redundante com o activeModule
    const itemsToMap =
      navigationItems.length === 1 && navigationItems[0].isGroup && navigationItems[0].children
        ? navigationItems[0].children
        : navigationItems;

    return itemsToMap.map(mapItem);
  }, [navigationItems]);

  // Descobre id do item ativo para realce no Orion Sidebar
  const activeItemId = useMemo(() => {
    const findActive = (items: NavItem[]): string | undefined => {
      for (const item of items) {
        if (item.children?.length) {
          const childActive = findActive(item.children);
          if (childActive) return childActive;
        }
        if (item.path && isActive(item.path)) {
          return item.path;
        }
      }
      return undefined;
    };
    return findActive(navigationItems);
  }, [navigationItems, isActive]);

  // Renderizador de link usando roteamento Next.js Link
  const renderLink: RenderLink = useCallback(
    ({ href, className, children, 'aria-current': ariaCurrent }) => (
      <Link
        href={href}
        className={className}
        aria-current={ariaCurrent}
        onClick={() => {
          if (mobile) onClose?.();
        }}
      >
        {children}
      </Link>
    ),
    [mobile, onClose]
  );

  // Módulo ativo e ação de troca
  const activeModule: SidebarModule = useMemo(() => {
    const isAgendamento = pathname.startsWith('/agendamento');
    return {
      name: isAgendamento ? 'Agendamento FCL' : 'Módulos',
      icon: isAgendamento ? Calendar : LayoutGrid,
      switchHref: '/modules',
      switchLabel: 'Trocar módulo',
    };
  }, [pathname]);

  // Identidade da marca Aurora
  const brand = useMemo(() => {
    const isCollapsed = !mobile && collapsed;
    return (
      <Link href="/modules" className="flex items-center justify-center transition-opacity hover:opacity-90 px-1 py-1">
        {isCollapsed ? (
          <Image
            src="/favicon-Aurora.png"
            alt="Aurora EADI"
            width={32}
            height={32}
            className="size-8 object-contain"
          />
        ) : (
          <Image
            src="/logo_principal.png"
            alt="Aurora EADI Manaus"
            width={170}
            height={44}
            priority
            className="h-8 w-auto max-w-full object-contain"
          />
        )}
      </Link>
    );
  }, [mobile, collapsed]);

  // Rodapé com Perfil e Logout ao lado da engrenagem
  const footer = useMemo(() => {
    const isCollapsed = !mobile && collapsed;

    if (isCollapsed) {
      return (
        <div className="flex flex-col items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-colors"
                  aria-label="Editar Perfil"
                >
                  <User className="size-4" />
                </button>
              }
            />
            <TooltipContent side="right">Editar Perfil</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex size-9 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  aria-label="Sair"
                >
                  <LogOut className="size-4" />
                </button>
              }
            />
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 w-full">
        {/* Botão de Perfil (Avatar + Nome/Email + Engrenagem) */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex flex-1 min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-sidebar-foreground/5 group"
          title="Editar Perfil"
        >
          <div className="flex size-7 items-center justify-center rounded-full bg-sidebar-foreground/10 text-sidebar-foreground shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
            <User className="size-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-sidebar-foreground text-xs">
              {currentUser?.name ?? 'Usuário'}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">
              {currentUser?.email ?? ''}
            </p>
          </div>
          <Settings className="size-3.5 text-sidebar-foreground/50 group-hover:text-sidebar-foreground transition-colors shrink-0" />
        </button>

        {/* Botão de Sair posicionado ao lado da engrenagem */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={handleLogout}
                className="flex size-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors shrink-0"
                aria-label="Sair"
              >
                <LogOut className="size-3.5" />
              </button>
            }
          />
          <TooltipContent side="top">Sair</TooltipContent>
        </Tooltip>
      </div>
    );
  }, [mobile, collapsed, currentUser, handleLogout]);

  if (!currentUser) return null;

  return (
    <>
      <OrionSidebar
        brand={brand}
        activeModule={activeModule}
        navigation={navigation}
        activeItemId={activeItemId}
        collapsed={mobile ? false : collapsed}
        onCollapsedChange={onCollapsedChange}
        collapsible={collapsible}
        renderLink={renderLink}
        onNavigate={() => {
          if (mobile) onClose?.();
        }}
        footer={footer}
        className={mobile ? 'h-full w-full border-r-0' : 'h-full overflow-visible'}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default React.memo(Sidebar);
