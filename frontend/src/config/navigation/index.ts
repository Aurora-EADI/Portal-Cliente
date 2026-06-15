import { Home } from 'lucide-react';
import { UserRole } from '@/types';
import { NavItem, NavigationContext } from './types';

export type { NavItem, NavigationContext } from './types';
import { mainNavigation } from './modules/main';
import { agendamentoFCLNavigation } from './modules/agendamento';

// Navegação estática (fallback)
export const allNavigationContexts: NavigationContext[] = [
    agendamentoFCLNavigation,
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
    // 0. Prioridade Máxima: Busca contexto estático marcado como staticOnly
    // Se o módulo deve ser apenas estático, não permitimos que o banco sobrescreva.
    let context = allNavigationContexts.find((ctx) => 
        (currentPath === ctx.basePath || currentPath.startsWith(ctx.basePath + '/')) && ctx.staticOnly
    );
    if (context) return context;

    // 1. Tenta busca exata no mapa dinâmico
    context = dynamicNavigationMap.get(currentPath);
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
