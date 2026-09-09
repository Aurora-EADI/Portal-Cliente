'use client'

import React, { useCallback } from 'react';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuthContext } from '@/context/AuthContext';

interface HeaderProps {
  pageTitle?: string;
  onMenuClick?: () => void;
}

/**
 * Identidade visual por perfil.
 *
 * O portal mostra dados diferentes para cada perfil, e o mesmo navegador troca
 * de sessão o tempo todo em suporte e homologação. Sem sinal visível, é fácil
 * concluir que "sumiu uma DI" quando, na verdade, a sessão é de outro perfil.
 *
 * A cor do header muda junto com o selo de propósito: cor se reconhece pela
 * periferia da visão, texto exige leitura. Se todos os perfis dividissem a
 * mesma cor, o selo viraria decoração.
 */
const PERFIL = {
  ADMIN: {
    rotulo: 'ADMINISTRADOR',
    header: 'from-purple-800 to-purple-700 border-purple-900/50',
    selo: 'bg-purple-50 text-purple-900',
  },
  EMPLOYEE: {
    rotulo: 'AURORA',
    // Laranja da marca para o time interno: é quem "é" a Aurora aqui dentro.
    header: 'from-orange-600 to-orange-500 border-orange-700/40',
    selo: 'bg-orange-50 text-orange-900',
  },
  DESPACHANTE: {
    rotulo: 'DESPACHANTE',
    header: 'from-emerald-800 to-emerald-700 border-emerald-900/50',
    selo: 'bg-emerald-50 text-emerald-900',
  },
  CLIENTE: {
    rotulo: 'CLIENTE',
    header: 'from-blue-800 to-blue-700 border-blue-900/50',
    selo: 'bg-blue-50 text-blue-900',
  },
  TRANSPORTADORA: {
    rotulo: 'TRANSPORTADORA',
    header: 'from-teal-800 to-teal-700 border-teal-900/50',
    selo: 'bg-teal-50 text-teal-900',
  },
} as const;

/** Perfil desconhecido aparece como está, em vez de sumir do header. */
const PERFIL_PADRAO = {
  rotulo: '',
  header: 'from-slate-800 to-slate-700 border-slate-900/50',
  selo: 'bg-slate-50 text-slate-900',
};

function perfilDe(role: string) {
  const conhecido = PERFIL[role as keyof typeof PERFIL];
  return conhecido ?? { ...PERFIL_PADRAO, rotulo: role };
}

export const Header: React.FC<HeaderProps> = ({ pageTitle = '', onMenuClick }) => {
  const { currentUser, logoutUser } = useAuthContext();

  const handleLogout = useCallback(() => logoutUser(), [logoutUser]);

  if (!currentUser) return null;

  const perfil = perfilDe(currentUser.role);
  const ehDev = process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev';

  return (
    <header
      className={`
        w-full
        bg-gradient-to-r ${perfil.header}
        border-b
        px-4 md:px-6 py-2.5
        sticky top-0 z-20
        shadow-sm
        relative
      `}
    >
      <div className="flex items-center justify-between h-12">

        {/* Menu + Logo + título */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 -ml-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
          )}
          <Logo src="/logo_principal.png" size="sm" />
          <span className="text-white font-semibold tracking-wide hidden md:block">
            {pageTitle}
          </span>
          {ehDev && (
            <span className="bg-yellow-400 text-red-900 text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wide shadow-lg">
              DESENVOLVIMENTO
            </span>
          )}
        </div>

        {/* Perfil + usuário + logout */}
        <div className="flex items-center gap-3">
          <span
            className={`
              hidden sm:inline-flex items-center gap-1.5
              px-2.5 py-1 rounded-md
              text-xs font-bold uppercase tracking-wide
              shadow-sm
              ${perfil.selo}
            `}
            title={`Você está usando o portal como ${perfil.rotulo}`}
          >
            <ShieldCheck size={13} aria-hidden />
            {perfil.rotulo}
          </span>

          <div className="flex flex-col text-right leading-tight">
            <span className="text-white font-medium text-sm">
              {currentUser.name}
            </span>
            {/* Abaixo de sm o selo some, e o perfil ocupa este lugar: entre os
                dois, quem está logado importa mais que a unidade, que é fixa. */}
            <span className="text-white/80 text-xs tracking-wider">
              <span className="sm:hidden">{perfil.rotulo}</span>
              <span className="hidden sm:inline">UNIDADE MATRIZ</span>
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="
              p-2 rounded-full
              text-white hover:text-white/70
              hover:bg-white/10
              transition-colors
            "
            aria-label="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>

      </div>

      {/* A cor do header passou a indicar o perfil, então o ambiente precisa de
          sinal próprio: sem esta faixa, dev e produção ficariam idênticos para
          o mesmo perfil — e confundir os dois custa mais caro que confundir
          perfil. */}
      {ehDev && (
        <div
          className="absolute inset-x-0 bottom-0 h-1 bg-red-600"
          aria-hidden
        />
      )}
    </header>
  );
};

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
export default React.memo(Header);
