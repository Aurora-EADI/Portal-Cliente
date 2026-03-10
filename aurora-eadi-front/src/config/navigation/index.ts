import { Home } from 'lucide-react';
import { UserRole } from '@/types';
import { NavItem, NavigationContext } from './types';

export type { NavItem, NavigationContext } from './types';
import { documentosNavigation } from './modules/documentos';
import { faturamentoNavigation } from './modules/faturamento';
import { estoqueNavigation } from './modules/estoque';
import { fornecedorNavigation } from './modules/fornecedor';
import { permissoesNavigation } from './modules/permissoes';
import { comercialNavigation } from './modules/comercial';
import { aereoNavigation } from './modules/aereo';
import { servicosNavigation } from './modules/servicos';
import { simulacoesNavigation } from './modules/simulacoes';
import { clienteNavigation } from './modules/cliente';
import { dtaNavigation } from './modules/dta';
import { dashboardNavigation } from './modules/dashboard';
import { mainNavigation } from './modules/main';

// Navegação estática (fallback)
export const allNavigationContexts: NavigationContext[] = [
    documentosNavigation,
    faturamentoNavigation,
    estoqueNavigation,
    fornecedorNavigation,
    permissoesNavigation,
    comercialNavigation,
    aereoNavigation,
    servicosNavigation,
    simulacoesNavigation,
    clienteNavigation,
    dtaNavigation,
    dashboardNavigation,
    mainNavigation,
];

// Map para lookup O(1) da navegação estática
export const navigationContextMap = new Map<string, NavigationContext>();

allNavigationContexts.forEach((ctx: NavigationContext) => {
    navigationContextMap.set(ctx.basePath, ctx);
});

// Navegação dinâmica (gerada a partir do banco de dados)
let dynamicNavigationContexts: NavigationContext[] = [];
const dynamicNavigationMap = new Map<string, NavigationContext>();

/**
 * Registra contextos de navegação dinâmicos (gerados a partir do banco).
 * Chamado pelo hook useNavigationWithPermissions ao receber dados do backend.
 */
export function setDynamicNavigationContexts(contexts: NavigationContext[]): void {
    dynamicNavigationContexts = contexts;
    dynamicNavigationMap.clear();
    contexts.forEach((ctx) => {
        dynamicNavigationMap.set(ctx.basePath, ctx);
    });
}

/**
 * Busca contexto de navegação: primeiro dinâmico, fallback para estático.
 */
function findNavigationContext(currentPath: string): NavigationContext | undefined {
    // 1. Tenta busca exata no mapa dinâmico
    let context = dynamicNavigationMap.get(currentPath);
    if (context) return context;

    // 2. Tenta busca por prefixo no dinâmico
    context = dynamicNavigationContexts.find((ctx) =>
        currentPath.startsWith(ctx.basePath)
    );
    if (context) return context;

    // 3. Fallback: busca exata no mapa estático
    context = navigationContextMap.get(currentPath);
    if (context) return context;

    // 4. Fallback: busca por prefixo no estático
    context = allNavigationContexts.find((ctx: NavigationContext) =>
        currentPath.startsWith(ctx.basePath)
    );

    return context;
}

/**
 * Obtem os itens de navegação baseado no path atual E no role do usuário.
 * Consulta primeiro navegação dinâmica, com fallback para estática.
 */
export const getNavigationByPathAndRole = (
    currentPath: string,
    userRole: UserRole
): NavItem[] => {
    const context = findNavigationContext(currentPath);

    if (!context) {
        return [{
            label: 'Home',
            icon: Home,
            path: '/modules'
        }];
    }

    return context.items.filter((item: NavItem) => {
        if (!item.requiredRoles || item.requiredRoles.length === 0) {
            return true;
        }
        return item.requiredRoles.includes(userRole);
    });
};

/**
 * Obtem os itens de navegação baseado no path atual.
 */
export const getNavigationByPath = (currentPath: string): NavItem[] => {
    const context = findNavigationContext(currentPath);

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
 * Verifica se usuário pode acessar o contexto.
 */
export const canAccessContext = (currentPath: string, userRole: UserRole): boolean => {
    const context = findNavigationContext(currentPath);

    if (!context || !context.allowedRoles) {
        return true;
    }

    return context.allowedRoles.includes(userRole);
};

// Re-export for compatibility
export const navigationContexts = allNavigationContexts;
