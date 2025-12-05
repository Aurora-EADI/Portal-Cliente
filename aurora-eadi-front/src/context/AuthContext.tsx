'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';

interface AuthContextType {
  currentUser: User | null;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = 'auth_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega o usuário do localStorage/Cookie apenas no cliente
  useEffect(() => {
    try {
      // Tenta carregar do localStorage primeiro
      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      } else {
        // Se não tiver no localStorage, tenta do cookie
        const cookieData = Cookies.get(AUTH_SESSION_KEY);
        if (cookieData) {
          const user = JSON.parse(cookieData);
          setCurrentUser(user);
          // Sincroniza com localStorage
          localStorage.setItem(AUTH_SESSION_KEY, cookieData);
        }
      }
    } catch (error) {
      console.error('Error loading auth session:', error);
      // Limpa dados corrompidos
      localStorage.removeItem(AUTH_SESSION_KEY);
      Cookies.remove(AUTH_SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginUser = (user: User) => {
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
    } catch (error) {
      console.error('❌ Error saving auth session:', error);
    }
  };

  const logoutUser = () => {
    console.log('🔓 Fazendo logout...');
    
    // Limpa o estado
    setCurrentUser(null);

    // ✅ SOLUÇÃO DEFINITIVA: Limpa TUDO do localStorage
    localStorage.clear();
    console.log('🗑️ localStorage completamente limpo');

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
    <AuthContext.Provider value={{ currentUser, loginUser, logoutUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
};