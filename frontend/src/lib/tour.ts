import { driver, type DriveStep, type Driver } from 'driver.js';
import type { UserRole } from '@/types';
import { TOURS, type TourPageId } from '@/config/tours';

/**
 * "Já viu o tour" fica no navegador, por usuário, página e versão. Trocar de
 * máquina mostra de novo — aceitável para ajuda. Storage pode estar bloqueado
 * (aba anônima, política do navegador): aí o tour só não é lembrado.
 */
function chaveVisto(userId: string, pagina: TourPageId): string {
  return `tour:${userId}:${pagina}:v${TOURS[pagina].versao}`;
}

export function tourJaVisto(userId: string, pagina: TourPageId): boolean {
  try {
    return window.localStorage.getItem(chaveVisto(userId, pagina)) === '1';
  } catch {
    return false;
  }
}

function marcarTourVisto(userId: string, pagina: TourPageId): void {
  try {
    window.localStorage.setItem(chaveVisto(userId, pagina), '1');
  } catch {
    // Sem storage o tour volta na próxima visita; não há o que fazer.
  }
}

/**
 * Passos que fazem sentido agora: do perfil do usuário e com o elemento na
 * tela. Aba escondida por perfil, lista vazia ou sidebar recolhida no celular
 * simplesmente somem do tour, em vez de apontar para o nada.
 */
export function passosDisponiveis(pagina: TourPageId, perfil: UserRole): DriveStep[] {
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
export function iniciarTour(pagina: TourPageId, usuario: { id: string; role: UserRole }): boolean {
  const passos = passosDisponiveis(pagina, usuario.role);
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
    // Fechar no meio também conta como visto: quem fechou não quer o tour de
    // volta na próxima visita, e o botão Ajuda continua lá.
    onDestroyed: () => {
      marcarTourVisto(usuario.id, pagina);
      ativo = null;
    },
  });
  ativo.drive();
  return true;
}

export function tourAtivo(): boolean {
  return ativo?.isActive() ?? false;
}
