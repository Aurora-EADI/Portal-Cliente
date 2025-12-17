'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserPermissionsResult } from '../types';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

interface AuthContextType {
  currentUser: User | null;
  userPermissions: UserPermissionsResult | null;
  loginUser: (user: User) => Promise<void>;
  logoutUser: () => void;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = 'auth_session';
const PERMISSIONS_KEY = 'user_permissions';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();

  // 🚀 OTIMIZAÇÃO: Inicializa sempre com null para evitar erro de hidratação
  // SSR e cliente começam com mesmo estado
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 🚀 OTIMIZAÇÃO: Carrega dados apenas no cliente (após hidratação)
  // useLayoutEffect executa antes do browser paint, mais rápido que useEffect
  useEffect(() => {
    const loadAuthData = () => {
      try {
        // Lê localStorage e permissions de uma única vez
        const saved = localStorage.getItem(AUTH_SESSION_KEY);
        const savedPermissions = localStorage.getItem(PERMISSIONS_KEY);

        if (saved) {
          const user = JSON.parse(saved);
          setCurrentUser(user);

          if (savedPermissions) {
            setUserPermissions(JSON.parse(savedPermissions));
            setIsLoading(false); // Tem tudo, pode finalizar
          } else {
            // Tem user mas não tem permissões, busca do backend
            fetchUserPermissions(user.id).finally(() => setIsLoading(false));
          }
        } else {
          // Fallback para cookie
          const cookieData = Cookies.get(AUTH_SESSION_KEY);
          if (cookieData) {
            const user = JSON.parse(cookieData);
            setCurrentUser(user);
            // Sincroniza com localStorage
            localStorage.setItem(AUTH_SESSION_KEY, cookieData);
            // Busca permissões
            fetchUserPermissions(user.id).finally(() => setIsLoading(false));
          } else {
            setIsLoading(false); // Não tem dados, finaliza loading
          }
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        // Limpa dados corrompidos
        localStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(PERMISSIONS_KEY);
        Cookies.remove(AUTH_SESSION_KEY);
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []); // Roda apenas uma vez no mount

  // Busca permissões do usuário do backend
  const fetchUserPermissions = async (userId: string) => {
    try {
      const response = await api.get(`/auth/me`);
      const permissions = response.data.permissions;

      setUserPermissions(permissions);
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
    }
  };

  const refreshPermissions = async () => {
    if (currentUser) {
      await fetchUserPermissions(currentUser.id);
    }
  };

  const loginUser = async (user: User) => {
    setCurrentUser(user);
    try {
      const userData = JSON.stringify(user);

      // Salva no localStorage (para acesso rápido no React)
      localStorage.setItem(AUTH_SESSION_KEY, userData);

      // Salva no Cookie (para o Middleware do Next.js ter acesso)
      Cookies.set(AUTH_SESSION_KEY, userData, {
        expires: 7, // 7 dias
        path: '/',
        sameSite: 'lax',
        secure: false, // false para funcionar em localhost
      });

      // Busca permissões do backend após login
      await fetchUserPermissions(user.id);
    } catch (error) {
      console.error('Error saving auth session:', error);
    }
  };

  const logoutUser = () => {
    // Limpa o estado
    setCurrentUser(null);
    setUserPermissions(null);

    // Limpa localStorage
    localStorage.clear();

    // Limpa sessionStorage (cache de módulos)
    sessionStorage.clear();

    // Remove cookies principais
    const cookiesToRemove = ['auth_session', 'token', 'access_token', 'refresh_token', 'user'];
    cookiesToRemove.forEach(key => {
      Cookies.remove(key, { path: '/' });
    });

    // Redireciona para login
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userPermissions,
        loginUser,
        logoutUser,
        isLoading,
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
};