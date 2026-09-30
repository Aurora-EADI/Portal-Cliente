'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { resolverPaginaTour, type TourPageId } from '@/config/tours';

/** Página de tour em que o usuário está, ou `null` se ela não tem tour. */
export function usePaginaTour(): TourPageId | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return resolverPaginaTour(pathname, searchParams.get('tab'));
}
