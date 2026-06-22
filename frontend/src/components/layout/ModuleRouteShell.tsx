'use client'

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
type GuardConfig = {
  moduleRoute: string;
  requiredPermissions: string[];
};

type LayoutConfig = {
  className?: string;
  maxWidth?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
    | 'full';
  showSidebar?: boolean;
  noPadding?: boolean;
};

type HeaderConfig = {
  pageTitle?: string;
};

export interface ModuleRouteShellProps {
  children: React.ReactNode;
  guard?: GuardConfig;
  layout?: LayoutConfig;
  wrapperClassName?: string;
  header?: HeaderConfig;
}

export function ModuleRouteShell({
  children,
  guard,
  layout,
  wrapperClassName = 'h-screen flex flex-col overflow-hidden',
  header,
}: ModuleRouteShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const content = (
    <div className={wrapperClassName}>
      <Header pageTitle={header?.pageTitle} onMenuClick={() => setMobileMenuOpen(true)} />
      <Layout {...layout} mobileMenuOpen={mobileMenuOpen} onMobileMenuChange={setMobileMenuOpen}>{children}</Layout>
    </div>
  );

  return content;
}
