'use client'

import React, { useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuthContext } from '@/context/AuthContext';

interface HeaderProps {
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle = '' }) => {
  const { currentUser, logoutUser } = useAuthContext();

  if (!currentUser) return null;

  const handleLogout = useCallback(() => logoutUser(), [logoutUser]);

  const userDisplay =
    currentUser.role === 'ADMIN' ? currentUser.name : currentUser.name;

  return (
    <header
      className="
        w-full
        bg-gradient-to-r from-primary-600 to-primary-500
        px-4 md:px-6 py-2.5
        sticky top-0 z-20
        border-b border-primary-700/40
        shadow-sm
      "
    >
      <div className="flex items-center justify-between h-12">

        {/* Logo + título */}
        <div className="flex items-center gap-3">
          <Logo src="/logo_principal.png" size="sm" />
          <span className="text-white font-semibold tracking-wide hidden md:block">
            {pageTitle}
          </span>
        </div>

        {/* Usuário + logout */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right leading-tight">
            <span className="text-white font-medium text-sm">
              {userDisplay}
            </span>
            <span className="text-white/80 text-xs tracking-wider">
              UNIDADE MATRIZ
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="
              p-2 rounded-full
              text-white hover:text-red-500
              hover:bg-white/10
              transition-colors
            "
            aria-label="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>

      </div>
    </header>
  );
};

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
export default React.memo(Header);
