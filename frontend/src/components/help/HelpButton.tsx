'use client';

import React, { useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/context/AuthContext';
import { usePaginaTour } from '@/hooks/usePaginaTour';
import { iniciarTour } from '@/lib/tour';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/orion/ui';

interface HelpButtonProps {
  /** Sidebar recolhida: só o ícone, com tooltip, como os botões vizinhos. */
  compacto?: boolean;
  /** No celular a sidebar é uma gaveta; fecha antes, senão o destaque fica atrás dela. */
  antesDeAbrir?: () => void;
}

/** Tempo da animação de fechamento da gaveta mobile. */
const ESPERA_GAVETA_MS = 350;

export function HelpButton({ compacto = false, antesDeAbrir }: HelpButtonProps) {
  const { currentUser } = useAuthContext();
  const pagina = usePaginaTour();

  const abrir = useCallback(() => {
    if (!currentUser) return;
    if (!pagina) {
      toast.info('Esta página ainda não tem explicação disponível.');
      return;
    }
    const usuario = { id: currentUser.id, role: currentUser.role };
    const iniciar = () => {
      if (!iniciarTour(pagina, usuario)) {
        toast.info('Esta página ainda não tem explicação disponível.');
      }
    };
    if (antesDeAbrir) {
      antesDeAbrir();
      window.setTimeout(iniciar, ESPERA_GAVETA_MS);
    } else {
      iniciar();
    }
  }, [currentUser, pagina, antesDeAbrir]);

  const botao = (
    <button
      type="button"
      data-tour="ajuda"
      onClick={abrir}
      aria-label="Ajuda"
      className={
        compacto
          ? 'flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-colors'
          : 'flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-colors shrink-0'
      }
    >
      <HelpCircle className={compacto ? 'size-4' : 'size-3.5'} />
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={botao} />
      <TooltipContent side={compacto ? 'right' : 'top'}>Ajuda</TooltipContent>
    </Tooltip>
  );
}
