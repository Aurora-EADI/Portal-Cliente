'use client';

import { useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { usePaginaTour } from '@/hooks/usePaginaTour';
import { iniciarTour, passosDisponiveis, tourAtivo, tourJaVisto } from '@/lib/tour';

const INTERVALO_MS = 400;
const LIMITE_MS = 8000;

/**
 * Abre o tour sozinho na primeira visita a cada página.
 *
 * As telas carregam dados depois de montar: abrir na hora destacaria uma lista
 * que ainda não existe. Espera o spinner da área de conteúdo sumir e a
 * quantidade de passos disponíveis parar de mudar; no limite, abre com o que
 * houver.
 */
export function TourAutoStart() {
  const { currentUser } = useAuthContext();
  const pagina = usePaginaTour();

  useEffect(() => {
    if (!currentUser || !pagina) return;
    if (tourJaVisto(currentUser.id, pagina)) return;

    const usuario = { id: currentUser.id, role: currentUser.role };
    const inicio = Date.now();
    let anterior = -1;
    let estavel = 0;

    const timer = window.setInterval(() => {
      if (tourAtivo()) return;
      // Diálogo aberto disputa foco e camada com o tour: espera fechar.
      const bloqueado = document.querySelector('[role="dialog"], [role="alertdialog"]');
      const carregando = document.querySelector('[data-tour-root] .animate-spin');
      const quantidade = passosDisponiveis(pagina, usuario.role).length;

      estavel = quantidade === anterior && !carregando ? estavel + 1 : 0;
      anterior = quantidade;

      const pronto = estavel >= 2 && !bloqueado;
      const esgotou = Date.now() - inicio > LIMITE_MS;
      if (pronto || (esgotou && !bloqueado)) {
        window.clearInterval(timer);
        iniciarTour(pagina, usuario);
      }
    }, INTERVALO_MS);

    return () => window.clearInterval(timer);
  }, [currentUser, pagina]);

  return null;
}
