'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, UserPermissionsResult } from '../types';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import {
  saveTokenExpiry,
  isSessionExpired,
  clearAllAuthData,
  refreshAccessTokenWithRetry,
  logout as logoutService,
} from '@/services/auth/token.service';

interface AuthContextType {
  currentUser: User | null;
  userPermissions: UserPermissionsResult | null;
  loginUser: (user: User, expiresAt: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = 'auth_session';
const PERMISSIONS_KEY = 'user_permissions';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Inicializa sempre com null para evitar erro de hidratação SSR
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega dados de autenticação ao montar o componente
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const saved = localStorage.getItem(AUTH_SESSION_KEY);
        const savedPermissions = localStorage.getItem(PERMISSIONS_KEY);

        console.log('[AUTH] isSessionExpired:', isSessionExpired());
        console.log('[AUTH] token_expires_at:', sessionStorage.getItem('token_expires_at'));
        console.log('[AUTH] auth_session no localStorage:', !!saved);

        // Sem dados de usuário no localStorage — tenta fallback via cookie
        if (!saved) {
          const cookieData = Cookies.get(AUTH_SESSION_KEY);
          if (cookieData) {
            // Tenta renovar sessão via cookie httpOnly refresh_token (com retry)
            const success = await refreshAccessTokenWithRetry(2);
            if (success) {
              const user = JSON.parse(cookieData);
              localStorage.setItem(AUTH_SESSION_KEY, cookieData);
              setCurrentUser(user);
              await fetchUserPermissions(user.id);
            } else {
              console.log('[AUTH] refresh falhou (sem auth_session) — limpando dados');
              clearAllAuthData();
            }
          }
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(saved);

        // Verifica se a sessão expirou com base no expires_at armazenado
        // (também é true quando sessionStorage está vazio, ex: nova aba)
        if (isSessionExpired()) {
          console.log('[AUTH] sessão expirada ou sem expires_at — tentando refresh com retry...');
          // Tenta renovar via cookie httpOnly refresh_token (com retry para erros transitórios)
          try {
            const success = await refreshAccessTokenWithRetry(2);

            console.log('[AUTH] refresh resultado:', success ? 'sucesso' : 'falhou');

            if (success) {
              setCurrentUser(user);

              if (savedPermissions) {
                setUserPermissions(JSON.parse(savedPermissions));
              } else {
                await fetchUserPermissions(user.id);
              }
            } else {
              console.log('[AUTH] refresh falhou após tentativas — limpando dados');
              clearAllAuthData();
              setCurrentUser(null);
              setUserPermissions(null);
            }
          } catch {
            clearAllAuthData();
            setCurrentUser(null);
            setUserPermissions(null);
          }
        } else {
          // Sessão válida — carrega usuário e permissões
          setCurrentUser(user);

          if (savedPermissions) {
            setUserPermissions(JSON.parse(savedPermissions));
          } else {
            await fetchUserPermissions(user.id);
          }
        }
      } catch {
        clearAllAuthData();
        setCurrentUser(null);
        setUserPermissions(null);
      } finally {
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
    } catch {
      // Silencioso — permissões serão obtidas na próxima chamada
    }
  };

  const refreshPermissions = async () => {
    if (currentUser) {
      await fetchUserPermissions(currentUser.id);
    }
  };

  /**
   * Chamado após login bem-sucedido
   * Recebe dados do usuário e o expires_at retornado pelo backend
   */
  const loginUser = async (user: User, expiresAt: string) => {
    setCurrentUser(user);
    try {
      const userData = JSON.stringify(user);

      // Salva expiração do access token (cookies httpOnly são gerenciados pelo backend)
      saveTokenExpiry(expiresAt);

      // Salva dados do usuário no localStorage
      localStorage.setItem(AUTH_SESSION_KEY, userData);

      // Salva no Cookie para o Middleware do Next.js ter acesso (não contém tokens)
      Cookies.set(AUTH_SESSION_KEY, userData, {
        expires: 7, // 7 dias
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      // Busca permissões do backend após login
      await fetchUserPermissions(user.id);
    } catch {
      // Erro ao salvar sessão — não é crítico para o fluxo
    }
  };

  const logoutUser = async () => {
    try {
      // Backend limpa os cookies httpOnly via Set-Cookie
      await logoutService();
    } catch {
      // Continua mesmo se falhar (limpa dados locais)
    } finally {
      // Limpa o estado
      setCurrentUser(null);
      setUserPermissions(null);

      // Limpa os dados de autenticação locais
      clearAllAuthData();

      // Limpa todos os caches do React Query
      queryClient.clear();

      // Redireciona para login
      router.push("/login");
    }
  };

  const updateCurrentUser = (user: User) => {
    setCurrentUser(user);
    try {
      const userData = JSON.stringify(user);
      localStorage.setItem(AUTH_SESSION_KEY, userData);

      // Atualiza o Cookie para o Middleware do Next.js
      Cookies.set(AUTH_SESSION_KEY, userData, {
        expires: 7, // 7 dias
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    } catch {
      // Erro ao atualizar usuário local — não é crítico
    }
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
        updateCurrentUser,
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
