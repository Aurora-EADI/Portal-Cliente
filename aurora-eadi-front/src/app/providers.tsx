'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ModuleAccessProvider } from '@/context/ModuleAccessContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // ✅ Cria o QueryClient dentro do componente para evitar problemas com SSR
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos (aumentado para dados relativamente estáticos)
        gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime no TanStack Query v4)
        refetchOnWindowFocus: false, // Evita refetch desnecessário ao voltar para aba
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* ModuleAccessProvider cacheia módulos/permissões e evita chamadas API duplicadas */}
        <ModuleAccessProvider>
          {/* ✅ ProtectedRoute protege TODAS as rotas */}
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </ModuleAccessProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}