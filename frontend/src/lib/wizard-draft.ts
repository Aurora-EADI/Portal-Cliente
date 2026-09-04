import { DadosFormData } from '@/components/pages/agendamento/steps/DadosStep';
import { NotificacoesFormData } from '@/components/pages/agendamento/steps/NotificacoesStep';

const DRAFT_KEY = 'agendamento-wizard-draft';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface WizardDraft {
  step: number;
  dados: DadosFormData;
  notificacoes: NotificacoesFormData;
}

interface StoredDraft extends WizardDraft {
  userId: string;
  timestamp: number;
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // storage indisponível (modo privado / bloqueado)
  }
}

/** Rascunho do usuário informado, ou null se ausente, de outro usuário, expirado ou corrompido. */
export function loadDraft(userId: string): WizardDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredDraft;
    const valid =
      parsed &&
      parsed.userId === userId &&
      typeof parsed.timestamp === 'number' &&
      Date.now() - parsed.timestamp <= DRAFT_TTL_MS &&
      typeof parsed.step === 'number' &&
      !!parsed.dados &&
      !!parsed.notificacoes;

    if (!valid) {
      clearDraft();
      return null;
    }

    return { step: parsed.step, dados: parsed.dados, notificacoes: parsed.notificacoes };
  } catch {
    clearDraft();
    return null;
  }
}

export function saveDraft(userId: string, draft: WizardDraft): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredDraft = { ...draft, userId, timestamp: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // quota estourada ou storage bloqueado: rascunho é best-effort
  }
}
