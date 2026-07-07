'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { userModuleAccessService } from '@/services/access/user-module-access.service';
import { ModuleAccess } from '@/types/access-control';
import { useAuthContext } from './AuthContext';

interface ModuleAccessContextType {
  modules: ModuleAccess[];
  isLoading: boolean;
  error: string | null;
  refreshModules: () => Promise<void>;
  getModuleByRoute: (route: string) => ModuleAccess | null;
  hasModuleAccess: (route: string) => boolean;
}

const ModuleAccessContext = createContext<ModuleAccessContextType | undefined>(undefined);

const MODULES_CACHE_KEY = 'user_modules_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const ModuleAccessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthContext();
  const [modules, setModules] = useState<ModuleAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar módulos (com cache)
  const loadModules = useCallback(async (userId: string, forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verifica cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(MODULES_CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp, userId: cachedUserId } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > CACHE_DURATION;

            // Usa cache se for do mesmo usuário e não estiver expirado
            if (cachedUserId === userId && !isExpired) {
              setModules(data);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // Cache corrompido, ignora e busca da API
            sessionStorage.removeItem(MODULES_CACHE_KEY);
          }
        }
      }

      // Busca da API se não tiver cache válido
      const response = await userModuleAccessService.getUserModulesWithAccessStatus(userId);
      const fetchedModules = response.modules || [];

      setModules(fetchedModules);

      // Salva no cache (sessionStorage é mais rápido que localStorage)
      sessionStorage.setItem(
        MODULES_CACHE_KEY,
        JSON.stringify({
          data: fetchedModules,
          timestamp: Date.now(),
          userId,
        })
      );
    } catch (err: any) {
      console.error('Erro ao carregar módulos:', err);
      setError(err.message || 'Erro ao carregar módulos');
      setModules([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // CLIENTE, DESPACHANTE e TRANSPORTADORA não usam o sistema de módulos
  const NO_MODULE_ROLES = ['CLIENTE', 'DESPACHANTE', 'TRANSPORTADORA'];
  useEffect(() => {
    if (currentUser?.id && !NO_MODULE_ROLES.includes(currentUser.role)) {
      loadModules(currentUser.id);
    } else {
      setModules([]);
      setIsLoading(false);
      sessionStorage.removeItem(MODULES_CACHE_KEY);
    }
  }, [currentUser?.id, currentUser?.role, loadModules]);

  // Função para forçar atualização
  const refreshModules = useCallback(async () => {
    if (currentUser?.id) {
      await loadModules(currentUser.id, true);
    }
  }, [currentUser?.id, loadModules]);

  // Helper: busca módulo por rota
  const getModuleByRoute = useCallback((route: string): ModuleAccess | null => {
    return modules.find(m => m.route === route && m.isEnabled === true) || null;
  }, [modules]);

  // Helper: verifica se tem acesso ao módulo
  const hasModuleAccess = useCallback((route: string): boolean => {
    return modules.some(m => m.route === route && m.isEnabled === true);
  }, [modules]);

  return (
    <ModuleAccessContext.Provider
      value={{
        modules,
        isLoading,
        error,
        refreshModules,
        getModuleByRoute,
        hasModuleAccess,
      }}
    >
      {children}
    </ModuleAccessContext.Provider>
  );
};

export const useModuleAccessContext = () => {
  const context = useContext(ModuleAccessContext);
  if (!context) {
    throw new Error('useModuleAccessContext must be used within ModuleAccessProvider');
  }
  return context;
};
