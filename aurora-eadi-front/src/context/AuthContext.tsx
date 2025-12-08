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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega o usuário e permissões do localStorage/Cookie apenas no cliente
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        // Tenta carregar do localStorage primeiro
        const saved = localStorage.getItem(AUTH_SESSION_KEY);
        if (saved) {
          const user = JSON.parse(saved);
          setCurrentUser(user);

          // Carrega permissões do localStorage
          const savedPermissions = localStorage.getItem(PERMISSIONS_KEY);
          if (savedPermissions) {
            setUserPermissions(JSON.parse(savedPermissions));
          } else {
            // Se não tiver permissões salvas, busca do backend
            await fetchUserPermissions(user.id);
          }
        } else {
          // Se não tiver no localStorage, tenta do cookie
          const cookieData = Cookies.get(AUTH_SESSION_KEY);
          if (cookieData) {
            const user = JSON.parse(cookieData);
            setCurrentUser(user);
            // Sincroniza com localStorage
            localStorage.setItem(AUTH_SESSION_KEY, cookieData);
            // Busca permissões do backend
            await fetchUserPermissions(user.id);
          }
        }
      } catch (error) {
        console.error('Error loading auth session:', error);
        // Limpa dados corrompidos
        localStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(PERMISSIONS_KEY);
        Cookies.remove(AUTH_SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  // Busca permissões do usuário do backend
  const fetchUserPermissions = async (userId: string) => {
    try {
      console.log('🔍 Buscando permissões do usuário:', userId);
      const response = await api.get(`/auth/me`);
      const permissions = response.data.permissions;

      setUserPermissions(permissions);
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
      console.log('✅ Permissões carregadas:', permissions);
    } catch (error) {
      console.error('❌ Erro ao buscar permissões:', error);
    }
  };

  const refreshPermissions = async () => {
    if (currentUser) {
      await fetchUserPermissions(currentUser.id);
    }
  };

  const loginUser = async (user: User) => {
    console.log('🔵 loginUser chamado com:', user);
    setCurrentUser(user);
    try {
      const userData = JSON.stringify(user);

      // ✅ Salva no localStorage (para acesso rápido no React)
      localStorage.setItem(AUTH_SESSION_KEY, userData);
      console.log('✅ Salvo no localStorage');

      // ✅ Salva no Cookie (para o Middleware do Next.js ter acesso)
      Cookies.set(AUTH_SESSION_KEY, userData, {
        expires: 7, // 7 dias
        path: '/',
        sameSite: 'lax', // ✅ 'lax' funciona melhor em desenvolvimento
        secure: false, // ✅ false para funcionar em localhost
      });

      // Verifica se salvou
      const cookieValue = Cookies.get(AUTH_SESSION_KEY);
      console.log('🍪 Cookie após salvar:', cookieValue ? 'Criado com sucesso' : '❌ FALHOU');
      console.log('✅ Usuário autenticado e salvo em localStorage + Cookie');

      // ✅ Busca permissões do backend após login
      await fetchUserPermissions(user.id);
    } catch (error) {
      console.error('❌ Error saving auth session:', error);
    }
  };

  const logoutUser = () => {
    console.log('🔓 Fazendo logout...');

    // Limpa o estado
    setCurrentUser(null);
    setUserPermissions(null);

    // ✅ SOLUÇÃO DEFINITIVA: Limpa TUDO do localStorage
    localStorage.clear();
    console.log('🗑️ localStorage completamente limpo (incluindo permissões)');

    // ✅ Remove cookies específicos
    const cookiesToRemove = [
      'auth_session',
      'token',
      'access_token',
      'refresh_token',
      'user',
    ];

    cookiesToRemove.forEach(key => {
      Cookies.remove(key, { path: '/' });
      console.log(`🗑️ Removido cookie: ${key}`);
    });

    // ✅ Limpa TODOS os cookies (força bruta)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('✅ Todas as credenciais limpas (localStorage + cookies)');

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