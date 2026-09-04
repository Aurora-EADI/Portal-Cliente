'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Download, Plus, CalendarPlus, Truck, Check } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Agendamento } from '@/types/agendamento';
import { StepIndicator } from './steps/StepIndicator';
import { DadosStep, DadosFormData, DadosSection } from './steps/DadosStep';
import { NotificacoesStep, NotificacoesFormData } from './steps/NotificacoesStep';
import { AtribuirTransportadoraForm } from './AtribuirTransportadoraForm';
import { VoucherDocument, downloadVoucherPdf } from './VoucherDocument';
import { loadDraft, saveDraft, clearDraft } from '@/lib/wizard-draft';

const WIZARD_STEPS = [
  { number: 1, title: 'Dados',         subtitle: 'Informações da carga' },
  { number: 2, title: 'Calendário',    subtitle: 'Data e horário' },
  { number: 3, title: 'Motorista',     subtitle: 'Motorista e transportadora' },
  { number: 4, title: 'Veículo',       subtitle: 'Placa do veículo' },
  { number: 5, title: 'Notificações',  subtitle: 'Configurar alertas' },
];
const LAST_STEP = WIZARD_STEPS.length;

const SECTION_BY_STEP: Record<number, DadosSection> = {
  1: 'dados',
  2: 'calendario',
  3: 'motorista',
  4: 'veiculo',
};

// Factory (não constante de módulo): dataAgendamento tem que ser "hoje" na hora
// em que o formulário é criado/limpo, não na hora em que o bundle carregou.
const makeInitialDados = (): DadosFormData => ({
  operacao: '', subOperacao: '', cargaEspecial: false, servicos: [],
  tipoVeiculo: '',
  dataAgendamento: new Date().toISOString().split('T')[0],
  inicio: '',
  cpfMotorista: '', nomeMotorista: '', transportadora: '', empresa: '',
  awbMawb: [], di: [], dta: [], hawb: [], numeroVoo: '',
  placaVeiculo: '', volumes: '', peso: '', consignatario: '', observacoes: '',
});

const makeInitialNotificacoes = (): NotificacoesFormData => ({
  notificarEmail: false, email: '',
  notificarWhatsapp: false, whatsapp: '',
});

const DRAFT_SAVE_DEBOUNCE_MS = 400;

const STEP_FIELD_CHECKS: Record<number, { field: keyof DadosFormData; label: string }[]> = {
  1: [
    { field: 'operacao', label: 'Operação' },
    { field: 'empresa', label: 'Empresa' },
  ],
  2: [
    { field: 'inicio', label: 'Data e horário' },
  ],
  3: [
    { field: 'cpfMotorista', label: 'CPF do motorista' },
    { field: 'transportadora', label: 'Transportadora' },
  ],
  4: [
    { field: 'tipoVeiculo', label: 'Tipo de veículo' },
    { field: 'placaVeiculo', label: 'Placa do veículo' },
  ],
};

function missingFieldsForStep(step: number, d: DadosFormData): string[] {
  const checks = STEP_FIELD_CHECKS[step] ?? [];
  return checks.filter(c => !d[c.field]).map(c => c.label);
}

function ConfirmationVoucher({ booking, onNew, onBack }: { booking: Agendamento; onNew: () => void; onBack: () => void }) {
  const voucherRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    const el = voucherRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      await downloadVoucherPdf(el, booking.protocolo);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="animate-in fade-in space-y-4">
      <VoucherDocument ref={voucherRef} booking={booking} />

      {/* Ações */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Salvar PDF
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo agendamento
        </button>
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-bold text-white bg-[#ED6A23] hover:bg-[#D45917] rounded-lg transition-colors shadow-sm"
        >
          Ver agendamentos
        </button>
      </div>
    </div>
  );
}

export function WizardView() {
  const router = useRouter();
  const { currentUser } = useAuthContext();
  const { handleSaveNovoAgendamento } = useAgendamento();
  const canDelegate = currentUser?.role === UserRole.CLIENTE || currentUser?.role === UserRole.DESPACHANTE;
  const [mode, setMode] = useState<'agendar' | 'atribuir'>('agendar');
  const [step, setStep] = useState(1);
  const [dados, setDados] = useState<DadosFormData>(makeInitialDados);
  const [notificacoes, setNotificacoes] = useState<NotificacoesFormData>(makeInitialNotificacoes);
  const [notifErrors, setNotifErrors] = useState<Partial<Record<keyof NotificacoesFormData, string>>>({});
  const [savedBooking, setSavedBooking] = useState<Agendamento | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (currentUser?.role === UserRole.DESPACHANTE) setMode('atribuir');
  }, [currentUser?.role]);

  // Restaura rascunho do localStorage uma única vez, assim que o usuário é conhecido.
  useEffect(() => {
    if (hydrated || !currentUser?.id) return;
    const draft = loadDraft(currentUser.id);
    if (draft) {
      setStep(draft.step);
      setDados(draft.dados);
      setNotificacoes(draft.notificacoes);
    }
    setHydrated(true);
  }, [currentUser?.id, hydrated]);

  // Salva rascunho (debounce: digitação dispara a cada tecla).
  // O guard `hydrated` evita que o estado inicial vazio sobrescreva o rascunho antes do load.
  useEffect(() => {
    const userId = currentUser?.id;
    if (!hydrated || !userId || savedBooking) return;
    const t = setTimeout(() => saveDraft(userId, { step, dados, notificacoes }), DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [hydrated, currentUser?.id, savedBooking, step, dados, notificacoes]);

  const validateNotificacoes = (): boolean => {
    const errs: Partial<Record<keyof NotificacoesFormData, string>> = {};
    if (notificacoes.notificarEmail && !notificacoes.email.includes('@'))
      errs.email = 'E-mail inválido.';
    if (notificacoes.notificarWhatsapp && notificacoes.whatsapp.replace(/\D/g, '').length < 10)
      errs.whatsapp = 'WhatsApp inválido (mínimo 10 dígitos).';
    setNotifErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBack = () => {
    if (step > 1) { setStep(s => s - 1); setNotifErrors({}); setSubmitError(null); }
    else router.push('/agendamento');
  };

  const handleDadosChange = (d: DadosFormData | ((prev: DadosFormData) => DadosFormData)) => {
    setDados(d);
    if (submitError) setSubmitError(null);
  };

  const handleNext = async () => {
    if (step < LAST_STEP) { setStep(s => s + 1); setSubmitError(null); return; }

    if (!validateNotificacoes()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const booking = await handleSaveNovoAgendamento(dados, notificacoes);
      clearDraft();
      setSavedBooking(booking);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro ao salvar agendamento.';
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  };

  const canAdvance = step < LAST_STEP ? missingFieldsForStep(step, dados).length === 0 : true;

  if (savedBooking) {
    return (
      <ConfirmationVoucher
        booking={savedBooking}
        onNew={() => {
          clearDraft();
          setSavedBooking(null);
          setStep(1);
          setDados(makeInitialDados());
          setNotificacoes(makeInitialNotificacoes());
        }}
        onBack={() => router.push('/agendamento')}
      />
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
      <div className="px-6 py-4 border-b border-zinc-100">
        <h2 className="text-base font-bold text-zinc-900">Novo agendamento</h2>
      </div>

      {canDelegate && (
        <div className="px-6 pt-4">
          <p className="text-xs font-bold text-zinc-500 mb-2">Como deseja prosseguir?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('agendar')}
              aria-pressed={mode === 'agendar'}
              className={`relative flex items-start gap-3 text-left p-4 rounded-lg border-2 transition-colors ${mode === 'agendar' ? 'border-[#ED6A23] bg-[#ED6A23]/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
            >
              {mode === 'agendar' && (
                <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#ED6A23] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
              <CalendarPlus className={`w-5 h-5 mt-0.5 shrink-0 ${mode === 'agendar' ? 'text-[#ED6A23]' : 'text-zinc-400'}`} />
              <div>
                <p className="text-sm font-bold text-zinc-900">Eu mesmo vou agendar</p>
                <p className="text-xs text-zinc-500 mt-0.5">Preencher os dados da retirada agora.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('atribuir')}
              aria-pressed={mode === 'atribuir'}
              className={`relative flex items-start gap-3 text-left p-4 rounded-lg border-2 transition-colors ${mode === 'atribuir' ? 'border-[#ED6A23] bg-[#ED6A23]/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
            >
              {mode === 'atribuir' && (
                <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#ED6A23] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
              <Truck className={`w-5 h-5 mt-0.5 shrink-0 ${mode === 'atribuir' ? 'text-[#ED6A23]' : 'text-zinc-400'}`} />
              <div>
                <p className="text-sm font-bold text-zinc-900">Atribuir a uma transportadora</p>
                <p className="text-xs text-zinc-500 mt-0.5">Delegar a retirada pra transportadora responsável.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === 'atribuir' ? (
        <AtribuirTransportadoraForm onBack={() => router.push('/agendamento')} />
      ) : (
        <>
          <StepIndicator currentStep={step} steps={WIZARD_STEPS} />

          {submitError && (
            <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="p-6">
            {step <= 4 && <DadosStep data={dados} onChange={handleDadosChange} disabled={saving} section={SECTION_BY_STEP[step]} />}
            {step === 5 && <NotificacoesStep data={notificacoes} onChange={setNotificacoes} errors={notifErrors} disabled={saving} />}
          </div>

          {step <= 4 && !canAdvance && (
            <p className="px-6 pb-2 text-xs text-amber-600">
              Faltando: {missingFieldsForStep(step, dados).join(', ')}
            </p>
          )}

          <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-3">
            <button
              onClick={handleBack}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-40"
            >
              {step > 1 ? 'Anterior' : 'Fechar'}
            </button>
            <button
              onClick={handleNext}
              disabled={!canAdvance || saving}
              className="px-5 py-2 text-sm font-bold text-white bg-[#ED6A23] hover:bg-[#D45917] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : step < LAST_STEP ? 'Próximo' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
