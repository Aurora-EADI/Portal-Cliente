'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserPermissionsResult } from '../types';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { isTokenExpired } from '@/lib/jwt-helper';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearAllAuthData,
  refreshAccessToken,
  logout as logoutService,
} from '@/services/auth/token.service';

interface AuthContextType {
  currentUser: User | null;
  userPermissions: UserPermissionsResult | null;
  loginUser: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logoutUser: () => Promise<void>;
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

  // Carrega dados de autenticação ao montar o componente
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const saved = localStorage.getItem(AUTH_SESSION_KEY);
        const savedPermissions = localStorage.getItem(PERMISSIONS_KEY);
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        // Não tem dados de usuário, finaliza
        if (!saved) {
          // Tenta fallback de cookie
          const cookieData = Cookies.get(AUTH_SESSION_KEY);
          if (cookieData && accessToken) {
            const user = JSON.parse(cookieData);
            localStorage.setItem(AUTH_SESSION_KEY, cookieData);

            // Valida token antes de usar
            if (!isTokenExpired(accessToken)) {
              setCurrentUser(user);
              await fetchUserPermissions(user.id);
            } else {
              // Token expirado, tenta renovar
              const newToken = await refreshAccessToken();
              if (newToken) {
                setCurrentUser(user);
                await fetchUserPermissions(user.id);
              } else {
                clearAllAuthData();
              }
            }
          }
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(saved);

        // Tem usuário salvo, valida tokens
        if (!accessToken || !refreshToken) {
          // Não tem tokens, limpa tudo
          console.log('[AUTH CONTEXT] Usuário sem tokens válidos, limpando dados');
          clearAllAuthData();
          setCurrentUser(null);
          setUserPermissions(null);
          setIsLoading(false);
          return;
        }

        // Verifica se access token está expirado
        if (isTokenExpired(accessToken)) {
          console.log('[AUTH CONTEXT] Access token expirado, tentando renovar...');

          // Tenta renovar usando refresh token
          try {
            const newToken = await refreshAccessToken();

            if (newToken) {
              console.log('[AUTH CONTEXT] Token renovado com sucesso');
              // Token renovado, continua com o login
              setCurrentUser(user);

              if (savedPermissions) {
                setUserPermissions(JSON.parse(savedPermissions));
              } else {
                await fetchUserPermissions(user.id);
              }
            } else {
              // Renovação falhou, limpa tudo
              console.log('[AUTH CONTEXT] Renovação falhou, limpando dados');
              clearAllAuthData();
              setCurrentUser(null);
              setUserPermissions(null);
            }
          } catch (error) {
            console.error('[AUTH CONTEXT] Erro ao renovar token:', error);
            clearAllAuthData();
            setCurrentUser(null);
            setUserPermissions(null);
          }
        } else {
          // Token válido, continua normalmente
          console.log('[AUTH CONTEXT] Token válido, carregando usuário');
          setCurrentUser(user);

          if (savedPermissions) {
            setUserPermissions(JSON.parse(savedPermissions));
          } else {
            await fetchUserPermissions(user.id);
          }
        }
      } catch (error) {
        console.error('[AUTH CONTEXT] Erro ao carregar dados de autenticação:', error);
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
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
    }
  };

  const refreshPermissions = async () => {
    if (currentUser) {
      await fetchUserPermissions(currentUser.id);
    }
  };

  const loginUser = async (user: User, accessToken: string, refreshToken: string) => {
    setCurrentUser(user);
    try {
      const userData = JSON.stringify(user);

      // Salva tokens usando o token service
      saveTokens(accessToken, refreshToken);

      // Salva dados do usuário no localStorage
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

      console.log('[AUTH CONTEXT] Login realizado com sucesso');
    } catch (error) {
      console.error('[AUTH CONTEXT] Erro ao salvar sessão:', error);
    }
  };

  const logoutUser = async () => {
    try {
      // Revoga refresh token no backend
      await logoutService();

      console.log('[AUTH CONTEXT] Logout realizado com sucesso');
    } catch (error) {
      console.error('[AUTH CONTEXT] Erro ao fazer logout:', error);
      // Continua mesmo se falhar (limpa dados locais)
    } finally {
      // Limpa o estado
      setCurrentUser(null);
      setUserPermissions(null);

      // Limpa todos os dados de autenticação
      clearAllAuthData();

      // Redireciona para login
      router.push("/login");
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