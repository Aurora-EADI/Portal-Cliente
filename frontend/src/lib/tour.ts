import { driver, type DriveStep, type Driver } from 'driver.js';
import type { UserRole } from '@/types';
import { TOURS, type TourPageId } from '@/config/tours';

/**
 * Passos que fazem sentido agora: do perfil do usuário e com o elemento na
 * tela. Aba escondida por perfil, lista vazia ou sidebar recolhida no celular
 * simplesmente somem do tour, em vez de apontar para o nada.
 */
function passosDisponiveis(pagina: TourPageId, perfil: UserRole): DriveStep[] {
  return TOURS[pagina].passos
    .filter((p) => !p.perfis || p.perfis.includes(perfil))
    .filter((p) => !p.elemento || document.querySelector(p.elemento))
    .map((p) => ({
      element: p.elemento,
      popover: { title: p.titulo, description: p.descricao, side: p.lado },
    }));
}

let ativo: Driver | null = null;

/** Abre o tour da página. Retorna `false` quando não há passo para mostrar. */
export function iniciarTour(pagina: TourPageId, perfil: UserRole): boolean {
  const passos = passosDisponiveis(pagina, perfil);
  if (passos.length === 0) return false;

  ativo?.destroy();
  ativo = driver({
    steps: passos,
    showProgress: passos.length > 1,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Próximo',
    prevBtnText: 'Anterior',
    doneBtnText: 'Concluir',
    popoverClass: 'portal-tour',
    stagePadding: 6,
    stageRadius: 8,
    onDestroyed: () => {
      ativo = null;
    },
  });
  ativo.drive();
  return true;
}
