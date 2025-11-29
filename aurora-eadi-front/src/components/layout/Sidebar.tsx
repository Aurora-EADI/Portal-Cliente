'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, User as UserIcon } from 'lucide-react';
import { UserRole } from '@/types';
import { Logo } from '@/components/ui/Logo';
import { getNavigationByPath } from '@/config/navigation';

interface SidebarItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export function SidebarItem({ label, icon, active, onClick }: SidebarItemProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={`
        w-full justify-start gap-3 
        text-slate-300 hover:bg-slate-800 hover:text-white
        ${active ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
      `}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

interface SidebarProps {
  className?: string;
  showUserInfo?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className = "", 
  showUserInfo = true 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logoutUser } = useAuthContext();

  if (!currentUser) return null;

  // 🎯 Obtém os itens de navegação baseado no PATH ATUAL
  const navigationItems = getNavigationByPath(pathname);

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logoutUser();
    router.push('/');
  };

  const getRoleLabel = (role: UserRole) => {
    return role === UserRole.ADMIN ? 'Administrador' : 'Fornecedor';
  };

  return (
    <div className={`w-full md:w-64 bg-slate-900 border-b md:border-r border-slate-700 flex flex-col ${className}`}>
      {/* Logo */}
      <div className="p-6 flex items-center justify-center md:justify-start border-b border-slate-800">
        <Logo src='/logo_principal.png' size="md" />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* User Info */}
          {showUserInfo && (
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-primary-400">
                <UserIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {getRoleLabel(currentUser.role)}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Items - Dinâmicos baseado no PATH */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <SidebarItem
                  key={item.path}
                  label={item.label}
                  icon={<IconComponent size={18} />}
                  active={isActive(item.path)}
                  onClick={() => router.push(item.path)}
                />
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-500 hover:bg-red-900/20 gap-2"
        >
          <LogOut size={18} />
          Sair
        </Button>
      </div>
    </div>
  );
};