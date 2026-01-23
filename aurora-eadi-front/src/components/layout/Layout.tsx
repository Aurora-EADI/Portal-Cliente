'use client'

import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  showSidebar?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className = '',
  maxWidth = '7xl',
  showSidebar = true,
}) => {
  const { currentUser } = useAuthContext();

  // Se não há usuário logado, renderiza apenas o children (ex: página de login)
  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Renderizado condicionalmente */}
      {showSidebar && <Sidebar />}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${className}`}>
        <div className={`${maxWidthClasses[maxWidth]} mx-auto p-4 md:p-8`}>
          {children}
        </div>
      </main>
    </div>
  );
};