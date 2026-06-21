'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Rotas públicas (não precisam de autenticação)
const PUBLIC_ROUTES = ['/', '/registro'];

/**
 * 🚀 OTIMIZAÇÃO: Guard de autenticação centralizado
 * Evita duplicação de verificações em páginas individuais
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoading } = useAuthContext();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Redireciona para login se não autenticado em rota protegida
  useEffect(() => {
    if (!isLoading && !isPublicRoute && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isLoading, pathname, isPublicRoute, router]);

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Mostra loading durante redirecionamento
  if (!isPublicRoute && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}