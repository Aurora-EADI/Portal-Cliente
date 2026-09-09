'use client'

import React, { useCallback } from 'react';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';

interface HeaderProps {
  pageTitle?: string;
  onMenuClick?: () => void;
}

/**
 * Selo do perfil em uso.
 *
 * O portal mostra dados diferentes para cada perfil, e o mesmo navegador troca
 * de sessão o tempo todo em suporte e homologação. Saber de relance quem está
 * logado evita a conclusão errada de que "sumiu uma DI" quando, na verdade, a
 * sessão é de outro perfil.
 *
 * Cada perfil tem cor própria — a distinção não pode depender de ler o texto,
 * senão o selo vira decoração. Todas as combinações são de fundo claro com
 * texto escuro, para manter contraste sobre o header laranja (produção) e
 * sobre o vermelho (desenvolvimento).
 */
const ROLE_ESTILO: Record<string, { rotulo: string; classe: string }> = {
  [UserRole.ADMIN]: {
    rotulo: 'ADMINISTRADOR',
    classe: 'bg-purple-100 text-purple-900 ring-purple-300/60',
  },
  [UserRole.EMPLOYEE]: {
    rotulo: 'AURORA',
    classe: 'bg-sky-100 text-sky-900 ring-sky-300/60',
  },
  [UserRole.DESPACHANTE]: {
    rotulo: 'DESPACHANTE',
    classe: 'bg-emerald-100 text-emerald-900 ring-emerald-300/60',
  },
  [UserRole.CLIENTE]: {
    rotulo: 'CLIENTE',
    classe: 'bg-amber-100 text-amber-900 ring-amber-300/60',
  },
  [UserRole.TRANSPORTADORA]: {
    rotulo: 'TRANSPORTADORA',
    classe: 'bg-cyan-100 text-cyan-900 ring-cyan-300/60',
  },
  [UserRole.SUPPLIER]: {
    rotulo: 'FORNECEDOR',
    classe: 'bg-slate-100 text-slate-900 ring-slate-300/60',
  },
};

/** Perfil desconhecido aparece como está, em vez de sumir do header. */
function estiloDoRole(role: string) {
  return (
    ROLE_ESTILO[role] ?? {
      rotulo: role,
      classe: 'bg-white/90 text-gray-900 ring-white/50',
    }
  );
}

export const Header: React.FC<HeaderProps> = ({ pageTitle = '', onMenuClick }) => {
  const { currentUser, logoutUser } = useAuthContext();

  if (!currentUser) return null;

  const handleLogout = useCallback(() => logoutUser(), [logoutUser]);

  const userDisplay = currentUser.name;
  const role = estiloDoRole(currentUser.role);

  return (
    <header
      className={`
        w-full
        ${process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev'
          ? 'bg-gradient-to-r from-red-700 to-red-600 border-b border-red-800/50'
          : 'bg-gradient-to-r from-orange-600 to-orange-500 border-b border-orange-700/40'
        }
        px-4 md:px-6 py-2.5
        sticky top-0 z-20
        shadow-sm
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
          {process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev' && (
            <span className="bg-yellow-400 text-red-900 text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wide shadow-lg">
              DESENVOLVIMENTO
            </span>
          )}
        </div>

        {/* Usuário + perfil + logout */}
        <div className="flex items-center gap-3">
          <span
            className={`
              hidden sm:inline-flex items-center gap-1.5
              px-2.5 py-1 rounded-md
              text-xs font-bold uppercase tracking-wide
              ring-1 shadow-sm
              ${role.classe}
            `}
            title={`Você está usando o portal como ${role.rotulo}`}
          >
            <ShieldCheck size={13} aria-hidden />
            {role.rotulo}
          </span>

          <div className="flex flex-col text-right leading-tight">
            <span className="text-white font-medium text-sm">
              {userDisplay}
            </span>
            {/* Em telas pequenas o selo some, então o perfil aparece aqui —
                é a informação que não pode faltar em nenhuma largura. */}
            <span className="text-white/80 text-xs tracking-wider">
              <span className="sm:hidden">{role.rotulo}</span>
              <span className="hidden sm:inline">UNIDADE MATRIZ</span>
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="
              p-2 rounded-full
              text-white hover:text-red-500
              hover:bg-white/10
              transition-colors
            "
            aria-label="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>

      </div>
    </header>
  );
};

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
export default React.memo(Header);
