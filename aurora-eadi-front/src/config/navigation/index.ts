import { Home } from 'lucide-react';
import { UserRole } from '@/types';
import { NavItem, NavigationContext } from './types';
import { documentosNavigation } from './modules/documentos';
import { faturamentoNavigation } from './modules/faturamento';
import { fornecedorNavigation } from './modules/fornecedor';
import { permissoesNavigation } from './modules/permissoes';
import { comercialNavigation } from './modules/comercial';
import { aereoNavigation } from './modules/aereo';
import { servicosNavigation } from './modules/servicos';
import { simulacoesNavigation } from './modules/simulacoes';
import { clienteNavigation } from './modules/cliente';
import { ccteNavigation } from './modules/ccte';
import { dashboardNavigation } from './modules/dashboard';
import { mainNavigation } from './modules/main';

export const allNavigationContexts: NavigationContext[] = [
    documentosNavigation,
    faturamentoNavigation,
    fornecedorNavigation,
    permissoesNavigation,
    comercialNavigation,
    aereoNavigation,
    servicosNavigation,
    simulacoesNavigation,
    clienteNavigation,
    ccteNavigation,
    dashboardNavigation,
    mainNavigation,
];

// OTIMIZAÇÃO: Map para lookup O(1)
export const navigationContextMap = new Map<string, NavigationContext>();

allNavigationContexts.forEach((ctx: NavigationContext) => {
    navigationContextMap.set(ctx.basePath, ctx);
});

/**
 * Função para obter os itens de navegação baseado no path atual E no role do usuário
 */
export const getNavigationByPathAndRole = (
    currentPath: string,
    userRole: UserRole
): NavItem[] => {
    // Tenta buscar contexto exato primeiro (O(1))
    let context = navigationContextMap.get(currentPath);

    // Se não encontrou exato, busca por prefixo (fallback para compatibilidade)
    if (!context) {
        context = allNavigationContexts.find((ctx: NavigationContext) =>
            currentPath.startsWith(ctx.basePath)
        );
    }

    if (!context) {
        // Fallback: retorna apenas Home
        return [{
            label: 'Home',
            icon: Home,
            path: '/modules'
        }];
    }

    // ✅ Filtra itens que o usuário pode ver por role
    return context.items.filter((item: NavItem) => {
        if (!item.requiredRoles || item.requiredRoles.length === 0) {
            return true;
        }
        return item.requiredRoles.includes(userRole);
    });
};

/**
 * Função para obter os itens de navegação baseado no path atual
 */
export const getNavigationByPath = (currentPath: string): NavItem[] => {
    const context = allNavigationContexts.find((ctx: NavigationContext) =>
        currentPath.startsWith(ctx.basePath)
    );

    if (context) {
        return context.items;
    }

    return [
        {
            label: 'Home',
            icon: Home,
            path: '/modules',
        }
    ];
};

/**
 * Função para verificar se usuário pode acessar o contexto
 */
export const canAccessContext = (currentPath: string, userRole: UserRole): boolean => {
    const context = allNavigationContexts.find((ctx: NavigationContext) =>
        currentPath.startsWith(ctx.basePath)
    );

    if (!context || !context.allowedRoles) {
        return true;
    }

    return context.allowedRoles.includes(userRole);
};

// Re-export for compatibility with code that still uses navigationContexts directly
export const navigationContexts = allNavigationContexts;
