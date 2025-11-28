'use client'
import React from 'react';
import { LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuthContext } from '@/context/AuthContext';

interface HeaderProps {
  pageTitle?: string; 
}

export const Header: React.FC<HeaderProps> = ({ pageTitle = 'Módulos' }) => {
  const { currentUser, logoutUser } = useAuthContext();
  
  if (!currentUser) return null;
  const handleLogout = () => {
    logoutUser(); 
  };
  
  const userDisplay = currentUser.role === 'ADMIN' ? 'Admin User' : currentUser.name;
  
  return (
    <header className="w-full bg-gradient-to-br from-primary-500 to-primary-600 border-b border-gray-200 py-3 px-6 sticky top-0 z-10">
      <div className="flex justify-between items-center max-w-full mx-auto">
        
        <div className="flex items-center gap-4">
          <Logo src='/logo_principal.png' size="sm" /> 
          <h1 className="text-xl font-semibold text-gray-800 hidden md:block"></h1>
        </div>
        
        <div className="flex items-center gap-4">
          
          <div className="flex flex-col items-end text-sm">
            <p className="text-white font-semibold">{userDisplay}</p>
            <p className="text-xs text-white uppercase tracking-wider">UNIDADE MATRIZ</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2 text-white hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            aria-label="Sair"
          >
            <LogOut size={20} />
          </button>
          
        </div>
      </div>
    </header>
  );
};