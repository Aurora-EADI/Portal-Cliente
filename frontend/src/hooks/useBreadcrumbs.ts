'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import type { BreadcrumbItem } from '@/components/orion/blocks';

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  wizard: 'Novo Agendamento',
  gate: 'Portaria (Gate)',
  dis: 'DIs & Containers',
  drivers: 'Motoristas',
  transportadoras: 'Transportadoras',
  config: 'Configurações',
};

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  if (pathname.startsWith('/modules')) {
    return [
      { label: 'Início', href: '/modules' },
      { label: 'Módulos', current: true },
    ];
  }

  if (pathname.startsWith('/agendamento')) {
    const currentTabLabel = tab ? (TAB_LABELS[tab] ?? tab) : 'Dashboard';

    return [
      { label: 'Início', href: '/modules' },
      { label: 'Agendamento FCL', href: '/agendamento' },
      { label: currentTabLabel, current: true },
    ];
  }

  // Fallback genérico para outras rotas
  const parts = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Início', href: '/modules' }];

  let accumulated = '';
  parts.forEach((part, index) => {
    accumulated += `/${part}`;
    const isLast = index === parts.length - 1;
    const formattedLabel = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
    items.push({
      label: formattedLabel,
      href: isLast ? undefined : accumulated,
      current: isLast,
    });
  });

  return items;
}

