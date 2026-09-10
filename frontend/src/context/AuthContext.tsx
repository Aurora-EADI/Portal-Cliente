'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { User } from '../types';
import { useRouter } from "next/navigation";
import { authService } from '@/services/api';
import { clearDraft } from '@/lib/wizard-draft';

interface AuthContextType {
  currentUser: User | null;
  loginUser: (user: User, expiresAt: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  isLoading: boolean;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      const maxAttempts = 3;
      try {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            if (Cookies.get('access_token') || Cookies.get('refresh_token')) {
              const user = await authService.getProfile();
              setCurrentUser(user);
            }
            return;
          } catch (err: any) {
            const isLastAttempt = attempt === maxAttempts - 1;
            if (isLastAttempt || err?.status === 401) return;
            await new Promise(r => setTimeout(r, 1500));
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginUser = async (user: User, _expiresAt: string) => {
    setCurrentUser(user);
  };

  const logoutUser = async () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    clearDraft();
    setCurrentUser(null);
    queryClient.clear();
    router.push("/");
  };

  const updateCurrentUser = (user: User) => {
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loginUser,
        logoutUser,
        isLoading,
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
