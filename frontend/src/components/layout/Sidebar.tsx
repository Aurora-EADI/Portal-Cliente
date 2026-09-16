'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Menu, ChevronLeft, User, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useNavigationWithPermissions } from '@/hooks/useNavigationWithPermissions';
import type { NavItem } from '@/config/navigation';
import { UserProfileModal } from './UserProfileModal';

interface SidebarItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  hasChildren?: boolean;
  isExpanded?: boolean;
  isChild?: boolean;
}

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
const SidebarItem = React.memo(function SidebarItem({
  label,
  icon,
  active,
  collapsed,
  onClick,
  hasChildren = false,
  isExpanded = false,
  isChild = false
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-all duration-300 group
        ${collapsed ? 'justify-center' : 'justify-start'}
        ${isChild ? 'pl-11' : ''}
        ${active
          ? 'bg-primary-500/10 text-white border border-primary-500/20 shadow-sm shadow-primary-500/5'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
        }
      `}
    >
      {/* Indicador Lateral para item ativo */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      )}

      <span className={`flex-shrink-0 ${active ? 'scale-110 text-primary-400' : 'group-hover:scale-105 group-hover:text-slate-200'} transition-all duration-200`}>
        {icon}
      </span>

      {!collapsed && (
        <span className={`flex-1 text-left font-medium transition-colors truncate mr-2 ${isChild ? 'text-xs' : 'text-sm'}`}>
          {label}
        </span>
      )}

      {/* Ícone de expansão para grupos */}
      {hasChildren && !collapsed && (
        <span className={`ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-0' : 'rotate-0 text-slate-500'}`}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      )}

      {/* Tooltip para modo colapsado */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md
                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap
                        shadow-lg z-50">
          {label}
        </div>
      )}
    </button>
  );
});

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobile = false, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, logoutUser } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const effectiveCollapsed = mobile ? false : collapsed;

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
    if (mobile) onClose?.();
  }, [router, mobile, onClose]);

  const navigationItems = useNavigationWithPermissions();

  if (!currentUser) return null;

  const isActive = (path: string) => {
    const [baseUrl, query] = path.split('?');
    if (pathname !== baseUrl) return false;

    if (query) {
      const params = new URLSearchParams(query);
      for (const [key, value] of params.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }

    // Path has no query — only active when current URL also has no search params
    return searchParams.toString() === '';
  };

  const isGroupActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child =>
      isActive(child.path) || isGroupActive(child)
    );
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleLogout = useCallback(() => {
    logoutUser();
    router.push('/');
  }, [logoutUser, router]);

  return (
    <div
      className={cn(
        'relative bg-gradient-to-b from-slate-900 to-slate-950',
        mobile
          ? 'flex flex-col h-full w-full'
          : 'border-r border-slate-800 h-screen flex flex-col transition-all duration-300 ease-in-out',
        !mobile && (effectiveCollapsed ? 'w-20' : 'w-64'),
      )}
    >
      {/* Toggle Button — desktop only */}
      {!mobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-20 bg-slate-800 hover:bg-slate-700
                     text-white rounded-full p-1.5 shadow-lg transition-all duration-200
                     hover:scale-110 border border-slate-700"
          aria-label={effectiveCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {effectiveCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {/* Logo */}
      <div className="p-6 flex items-center justify-center border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          {!effectiveCollapsed ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg 
                              flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">AE</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Aurora EADI
              </span>
            </>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg 
                            flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">AE</span>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div
        onClick={() => setIsProfileModalOpen(true)}
        className={`
          px-4 py-3 border-b border-slate-800/50 cursor-pointer 
          hover:bg-slate-800/50 transition-colors group relative
          ${effectiveCollapsed ? 'flex justify-center' : ''}
        `}
      >
        <div className="flex items-center gap-3 text-slate-300">
          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-primary-600/20 group-hover:text-primary-400 transition-colors">
            <User size={16} />
          </div>
          {!effectiveCollapsed && currentUser && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentUser.email}
              </p>
            </div>
          )}
          {!effectiveCollapsed && (
            <Settings size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {effectiveCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md
                          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap
                          shadow-lg z-50">
            Editar Perfil
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = isGroupActive(item) || (expandedGroups[item.label] ?? false);

            if (hasChildren) {
              return (
                <div key={item.label}>
                  {/* Grupo Colapsável */}
                  <SidebarItem
                    label={item.label}
                    icon={<Icon size={20} />}
                    active={isGroupActive(item)}
                    collapsed={effectiveCollapsed}
                    hasChildren={true}
                    isExpanded={isExpanded}
                    onClick={() => {
                      if (effectiveCollapsed) {
                        handleNavigate(item.path);
                      } else {
                        toggleGroup(item.label);
                      }
                    }}
                  />

                  {/* Subitens (apenas quando expandido e sidebar não colapsada) */}
                  {!effectiveCollapsed && isExpanded && (
                    <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const childHasChildren = child.children && child.children.length > 0;
                        const childIsExpanded = isGroupActive(child) || (expandedGroups[child.label] ?? false);

                        if (childHasChildren) {
                          // Sub-grupo de segundo nível (ex: "Relatórios")
                          return (
                            <div key={child.label}>
                              <SidebarItem
                                label={child.label}
                                icon={<ChildIcon size={16} />}
                                active={isGroupActive(child)}
                                collapsed={effectiveCollapsed}
                                hasChildren={true}
                                isExpanded={childIsExpanded}
                                isChild={true}
                                onClick={() => toggleGroup(child.label)}
                              />
                              {childIsExpanded && (
                                <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                  {child.children?.map((grandChild) => {
                                    const GrandChildIcon = grandChild.icon;
                                    return (
                                      <button
                                        key={grandChild.path}
                                        onClick={() => handleNavigate(grandChild.path)}
                                        className={`
                                          w-full flex items-center gap-3 pl-16 pr-3 py-2 rounded-lg
                                          transition-all duration-200 text-xs font-medium
                                          ${isActive(grandChild.path)
                                            ? 'bg-primary-500/10 text-white border border-primary-500/20'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                                          }
                                        `}
                                      >
                                        <GrandChildIcon size={14} />
                                        <span className="truncate">{grandChild.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Item simples filho
                        return (
                          <SidebarItem
                            key={child.path}
                            label={child.label}
                            icon={<ChildIcon size={16} />}
                            active={isActive(child.path)}
                            collapsed={effectiveCollapsed}
                            isChild={true}
                            onClick={() => handleNavigate(child.path)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Item simples (sem filhos)
            return (
              <SidebarItem
                key={item.path}
                label={item.label}
                icon={<Icon size={20} />}
                active={isActive(item.path)}
                collapsed={effectiveCollapsed}
                onClick={() => handleNavigate(item.path)}
              />
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800/50">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            transition-all duration-200 group
            text-red-400 hover:bg-red-950/30 hover:text-red-300
            ${effectiveCollapsed ? 'justify-center' : 'justify-start'}
          `}
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          {!effectiveCollapsed && <span className="font-medium text-sm">Sair</span>}

          {effectiveCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md 
                            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap
                            shadow-lg z-50">
              Sair
            </div>
          )}
        </button>
      </div>

      {/* Modal de Perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
export default React.memo(Sidebar);
