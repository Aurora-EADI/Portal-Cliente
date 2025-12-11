import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { userModuleAccessService } from '@/services/access/user-module-access.service';
import { ModuleAccess } from '@/types/access-control';

interface ModuleAccessResult {
  isLoading: boolean;
  hasAccess: boolean;
  module: ModuleAccess | null;
  error: string | null;
}

/**
 * Hook para verificar se o usuário tem acesso a um módulo específico
 * @param route - Rota do módulo (ex: /permissoes)
 * @returns Estado de acesso ao módulo
 */
export function useModuleAccess(route: string): ModuleAccessResult {
  const { currentUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [module, setModule] = useState<ModuleAccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setIsLoading(false);
        setHasAccess(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Busca todos os módulos do usuário
        const response = await userModuleAccessService.getUserModulesWithAccessStatus(currentUser.id);

        // Encontra o módulo pela rota
        const foundModule = response.modules.find(
          (m) => m.route === route && m.isEnabled === true
        );

        if (foundModule) {
          setHasAccess(true);
          setModule(foundModule);
        } else {
          setHasAccess(false);
          setModule(null);
        }
      } catch (err: any) {
        console.error('Erro ao verificar acesso ao módulo:', err);
        setError(err.message || 'Erro ao verificar permissões');
        setHasAccess(false);
        setModule(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [currentUser, route]);

  return { isLoading, hasAccess, module, error };
}
