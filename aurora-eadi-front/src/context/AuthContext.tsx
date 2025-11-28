import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializa como null para evitar problemas de hidratação
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega o usuário do localStorage apenas no cliente (useEffect)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('auth_session');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading auth session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginUser = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('auth_session', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving auth session:', error);
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('auth_session');
    } catch (error) {
      console.error('Error removing auth session:', error);
    }
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