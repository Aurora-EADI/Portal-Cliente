'use client'

import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/useIsMobile';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  showSidebar?: boolean;
  noPadding?: boolean;
  mobileMenuOpen?: boolean;
  onMobileMenuChange?: (open: boolean) => void;
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
  noPadding = false,
  mobileMenuOpen = false,
  onMobileMenuChange,
}) => {
  const { currentUser } = useAuthContext();
  const isMobile = useIsMobile();

  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      {showSidebar && !isMobile && <Sidebar />}

      {/* Mobile Sidebar Drawer */}
      {showSidebar && isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={onMobileMenuChange}>
          <SheetContent side="left" className="p-0 w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800">
            <Sidebar mobile onClose={() => onMobileMenuChange?.(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${className}`}>
        <div className={`${maxWidthClasses[maxWidth]} mx-auto ${noPadding ? '' : 'p-4 md:p-8'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};