'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // ✅ Cria o QueryClient dentro do componente para evitar problemas com SSR
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* ✅ ProtectedRoute protege TODAS as rotas */}
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </AuthProvider>
    </QueryClientProvider>
  );
}