'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/api';

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

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
    if (MOCK_MODE) {
      setIsLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const user = await authService.getProfile();
          setCurrentUser(user);
        }
      } catch {
        // No valid session or profile fetch failed
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginUser = async (user: User, _expiresAt: string) => {
    setCurrentUser(user);
  };

  const logoutUser = async () => {
    try {
      if (!MOCK_MODE) {
        await supabase.auth.signOut();
      }
    } catch {
      // Continue even if signOut fails
    } finally {
      setCurrentUser(null);
      queryClient.clear();
      router.push("/");
    }
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
