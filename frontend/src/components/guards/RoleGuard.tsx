'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
    allowedRoles: UserRole[];
    redirectTo?: string;
    children: React.ReactNode;
}

/**
 * Guard que verifica o role do usuário e redireciona se não tiver permissão.
 * 
 * @param allowedRoles - Lista de roles permitidos para acessar o conteúdo
 * @param redirectTo - Rota para redirecionar se o usuário não tiver role permitido (default: /modules)
 * @param children - Conteúdo a renderizar se o usuário tiver role permitido
 * 
 * @example
 * // Bloqueia SUPPLIER e redireciona para /documentos/empresa
 * <RoleGuard allowedRoles={[UserRole.ADMIN]} redirectTo="/documentos/empresa">
 *   <AdminDashboard />
 * </RoleGuard>
 */
export function RoleGuard({
    allowedRoles,
    redirectTo = '/modules',
    children,
}: RoleGuardProps) {
    const router = useRouter();
    const { currentUser, isLoading } = useAuthContext();

    const hasAllowedRole = currentUser && allowedRoles.includes(currentUser.role);

    useEffect(() => {
        if (!isLoading && currentUser && !hasAllowedRole) {
            router.replace(redirectTo);
        }
    }, [currentUser, isLoading, hasAllowedRole, redirectTo, router]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    // Aguardando redirecionamento (usuário não tem role permitido)
    if (!hasAllowedRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Redirecionando...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
