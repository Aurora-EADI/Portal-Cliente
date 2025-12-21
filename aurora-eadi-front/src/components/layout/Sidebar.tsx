'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Menu, ChevronLeft, User } from 'lucide-react';
import { useNavigationWithPermissions } from '@/hooks/useNavigationWithPermissions';

interface SidebarItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
const SidebarItem = React.memo(function SidebarItem({ label, icon, active, collapsed, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-all duration-200 group
        ${collapsed ? 'justify-center' : 'justify-start'}
        ${active
          ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }
      `}
    >
      <span className={`flex-shrink-0 ${active ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}>
        {icon}
      </span>

      {!collapsed && (
        <span className="whitespace-nowrap font-medium text-sm">
          {label}
        </span>
      )}

      {/* Indicador visual para item ativo */}
      {active && !collapsed && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
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

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logoutUser } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);

  const navigationItems = useNavigationWithPermissions();

  if (!currentUser) return null;

  const isActive = (path: string) => pathname === path;

  const handleLogout = useCallback(() => {
    logoutUser();
    router.push('/');
  }, [logoutUser, router]);

  return (
    <aside
      className={`
        relative bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800
        h-screen flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-20 bg-slate-800 hover:bg-slate-700 
                   text-white rounded-full p-1.5 shadow-lg transition-all duration-200
                   hover:scale-110 border border-slate-700"
        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className="p-6 flex items-center justify-center border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          {!collapsed ? (
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
      {!collapsed && currentUser && (
        <div className="px-4 py-3 border-b border-slate-800/50">
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarItem
                key={item.path}
                label={item.label}
                icon={<Icon size={20} />}
                active={isActive(item.path)}
                collapsed={collapsed}
                onClick={() => router.push(item.path)}
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
            ${collapsed ? 'justify-center' : 'justify-start'}
          `}
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="font-medium text-sm">Sair</span>}

          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md 
                            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap
                            shadow-lg z-50">
              Sair
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
export default React.memo(Sidebar);