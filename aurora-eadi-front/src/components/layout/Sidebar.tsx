'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Menu, ChevronLeft } from 'lucide-react';
import { UserRole } from '@/types';
import { useNavigationWithPermissions } from '@/hooks/useNavigationWithPermissions';

interface SidebarItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function SidebarItem({ label, icon, active, collapsed, onClick }: SidebarItemProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={`
        w-full flex items-center 
        justify-${collapsed ? "center" : "start"} 
        gap-3 transition-all duration-200 
        overflow-hidden
        text-slate-300 hover:bg-slate-800 hover:text-white
        ${active ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
        ${collapsed ? "px-3" : "px-4"}
      `}
      onClick={onClick}
    >
      {icon}
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Button>
  );
}

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logoutUser } = useAuthContext();

  const [collapsed, setCollapsed] = useState(false);

  // Obtém itens de navegação filtrados por permissões
  const navigationItems = useNavigationWithPermissions();

  if (!currentUser) return null;

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logoutUser();
    router.push('/');
  };

  return (
    <div
      className={`
        relative
        bg-slate-900 border-r border-slate-700 
         h-screen flex flex-col
        transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Collapse Button */}
      <div className="absolute -right-5 top-4 z-20">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full shadow-md"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* LOGO */}
      <div className="p-4 flex items-center justify-center border-b border-slate-800">
        {!collapsed ? (
          <span className="text-white font-semibold text-lg tracking-wide">Aurora EADI</span>
        ) : (
          <span className="text-white text-lg font-bold">AE</span>
        )}
      </div>

      {/* NAVIGATION */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarItem
                  key={item.path}
                  label={item.label}
                  icon={<Icon size={18} />}
                  active={isActive(item.path)}
                  collapsed={collapsed}
                  onClick={() => router.push(item.path)}
                />
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-2 
            justify-${collapsed ? "center" : "start"}
            text-red-500 hover:bg-red-900/20
          `}
        >
          <LogOut size={18} />
          {!collapsed && "Sair"}
        </Button>
      </div>
    </div>
  );
};
