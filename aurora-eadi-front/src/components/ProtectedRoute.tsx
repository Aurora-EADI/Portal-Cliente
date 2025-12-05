'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoading } = useAuthContext();

  // ✅ Rotas públicas (não precisam de autenticação)
  const publicRoutes = ['/'];

  useEffect(() => {
    
    if (isLoading) {
      return;
    }

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isPublicRoute && !currentUser) {
      router.push(`/`);
    } else if (!isPublicRoute && currentUser) {
    } else if (isPublicRoute) {
    }
  }, [currentUser, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verificando autenticação...</p>
          <p className="text-gray-400 text-sm mt-2">Aguarde um momento...</p>
        </div>
      </div>
    );
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  if (!isPublicRoute && !currentUser) {
    console.log('🔄 Aguardando redirecionamento...');
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