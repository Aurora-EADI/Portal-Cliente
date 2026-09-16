'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { useRouter } from "next/navigation";
import { authService } from '@/services/api';
import { authClient } from '@/lib/auth-client';
import { clearDraft } from '@/lib/wizard-draft';

interface AuthContextType {
  currentUser: User | null;
  loginUser: (user: User) => Promise<void>;
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
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    if (isSessionPending) return;
    if (!session) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    authService.getProfile()
      .then((user) => { if (!cancelled) setCurrentUser(user); })
      .catch(() => { if (!cancelled) setCurrentUser(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [isSessionPending, session]);

  const loginUser = async (user: User) => {
    setCurrentUser(user);
  };

  const logoutUser = async () => {
    // Cookie httpOnly so o servidor apaga.
    await authService.logout();
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
