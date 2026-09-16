'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppShell, type RenderLink } from '@/components/orion/blocks';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

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

type GuardConfig = {
  moduleRoute: string;
  requiredPermissions: string[];
};

export interface ModuleRouteShellProps {
  children: React.ReactNode;
  guard?: GuardConfig;
  layout?: LayoutConfig;
  wrapperClassName?: string;
  header?: HeaderConfig;
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

export function ModuleRouteShell({
  children,
  layout,
}: ModuleRouteShellProps) {
  const breadcrumbs = useBreadcrumbs();

  const renderLink: RenderLink = useCallback(
    ({ href, className, children: linkChildren, 'aria-current': ariaCurrent }) => (
      <Link href={href} className={className} aria-current={ariaCurrent}>
        {linkChildren}
      </Link>
    ),
    []
  );

  const maxWidth = layout?.maxWidth ?? '7xl';
  const noPadding = layout?.noPadding ?? false;

  return (
    <AppShell
      breadcrumbs={breadcrumbs}
      renderLink={renderLink}
      renderSidebar={(slotProps) => (
        <Sidebar
          mobile={slotProps.isMobile}
          collapsed={slotProps.collapsed}
          onCollapsedChange={slotProps.onCollapsedChange}
          collapsible={slotProps.collapsible}
          onClose={slotProps.onNavigate}
        />
      )}
      contentClassName="bg-gray-50 flex flex-col"
    >
      <div className={`flex-1 w-full ${maxWidthClasses[maxWidth]} mx-auto ${noPadding ? '' : 'p-4 md:p-8'} ${layout?.className ?? ''}`}>
        {children}
      </div>
    </AppShell>
  );
}
