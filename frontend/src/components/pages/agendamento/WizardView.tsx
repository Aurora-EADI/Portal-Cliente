'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2, Download, Plus } from 'lucide-react';
import Image from 'next/image';
import { useAgendamento } from '@/context/AgendamentoContext';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Agendamento } from '@/types/agendamento';
import { StepIndicator } from './steps/StepIndicator';
import { DadosStep, DadosFormData } from './steps/DadosStep';
import { NotificacoesStep, NotificacoesFormData } from './steps/NotificacoesStep';
import { AtribuirTransportadoraForm } from './AtribuirTransportadoraForm';

const WIZARD_STEPS = [
  { number: 1, title: 'Dados',         subtitle: 'Informações do agendamento' },
  { number: 2, title: 'Notificações',  subtitle: 'Configurar alertas' },
];

const INITIAL_DADOS: DadosFormData = {
  operacao: '', subOperacao: '', cargaEspecial: false, servicos: [],
  tipoVeiculo: '',
  dataAgendamento: new Date().toISOString().split('T')[0],
  inicio: '',
  cpfMotorista: '', nomeMotorista: '', transportadora: '', empresa: '',
  awbMawb: [], di: [], dta: [], hawb: [], numeroVoo: '',
  placaVeiculo: '', volumes: '', peso: '', consignatario: '', observacoes: '',
};

const INITIAL_NOTIFICACOES: NotificacoesFormData = {
  notificarEmail: false, email: '',
  notificarWhatsapp: false, whatsapp: '',
};

function isDadosValid(d: DadosFormData) {
  return !!(d.operacao && d.tipoVeiculo && d.inicio && d.cpfMotorista && d.transportadora && d.empresa && d.placaVeiculo);
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function ConfirmationVoucher({ booking, onNew, onBack }: { booking: Agendamento; onNew: () => void; onBack: () => void }) {
  const voucherRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const el = voucherRef.current;
    if (!el) return;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const origWidth = el.style.width;
    el.style.width = '800px';

    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', width: 800 });

    el.style.width = origWidth;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, imgHeight);
    pdf.save(`agendamento-${booking.protocolo}.pdf`);
  };

  return (
    <div className="animate-in fade-in space-y-4">
      {/* Voucher card */}
      <div ref={voucherRef} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header com logo */}
        <div className="px-4 sm:px-8 py-5 border-b border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Image src="/logo-aurora.png" alt="Aurora" width={130} height={44} className="object-contain" />
            <div className="h-10 w-px bg-zinc-200 hidden sm:block" />
            <div className="hidden sm:block">
              <p className="text-zinc-900 text-sm font-bold">Comprovante de Agendamento</p>
              <p className="text-zinc-400 text-[11px] mt-0.5">Portal do Cliente</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[#ED6A23] font-mono text-sm font-bold">{booking.protocolo}</p>
            <p className="text-zinc-400 text-[11px]">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Status */}
        <div className="px-8 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">Agendamento confirmado</p>
            <p className="text-[11px] text-emerald-600">Seu agendamento foi registrado com sucesso no sistema.</p>
          </div>
        </div>

        {/* Dados */}
        <div className="px-4 sm:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
            {(booking.diNumero || booking.di) && <InfoField label="D.I" value={Array.isArray(booking.di) ? booking.di.join(', ') : (booking.diNumero || booking.di || '—')} mono />}
            {booking.container && <InfoField label="Container" value={booking.container} mono />}
            <InfoField label="Data" value={formatDate(booking.data)} />
            <InfoField label="Horário" value={booking.horario} />
            <InfoField label="Operação" value={booking.operacao ?? '—'} />
            {booking.subOperacao && <InfoField label="SubOperação" value={booking.subOperacao} />}
            <InfoField label="Motorista" value={booking.motorista?.nome || '—'} />
            <InfoField label="CPF" value={booking.motorista?.cpf || '—'} mono />
            <InfoField label="Placa" value={booking.veiculo?.placa || '—'} mono />
            <InfoField label="Veículo" value={booking.veiculo?.tipo || booking.veiculo?.modelo || '—'} />
            <InfoField label="Transportadora" value={booking.transportadora ?? '—'} />
            <InfoField label="Empresa" value={booking.empresa ?? '—'} />
            {booking.awbMawb && <InfoField label="AWB / MAWB" value={Array.isArray(booking.awbMawb) ? booking.awbMawb.join(', ') : booking.awbMawb} mono />}
            {booking.consignatario && <InfoField label="Consignatário" value={booking.consignatario} />}
          </div>

          {booking.observacao && (
            <div className="mt-5 pt-4 border-t border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Observações</p>
              <p className="text-xs text-zinc-600">{booking.observacao}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-[10px] text-zinc-400">Aurora EADI — Terminal de Cargas</p>
          <p className="text-[10px] text-zinc-400 font-mono">{booking.protocolo}</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Salvar PDF
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

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm text-zinc-800 font-semibold ${mono ? 'font-mono' : ''}`}>{value}</p>
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
  const [dados, setDados] = useState<DadosFormData>(INITIAL_DADOS);
  const [notificacoes, setNotificacoes] = useState<NotificacoesFormData>(INITIAL_NOTIFICACOES);
  const [notifErrors, setNotifErrors] = useState<Partial<Record<keyof NotificacoesFormData, string>>>({});
  const [savedBooking, setSavedBooking] = useState<Agendamento | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleDadosChange = (d: DadosFormData) => {
    setDados(d);
    if (submitError) setSubmitError(null);
  };

  const handleNext = async () => {
    if (step < 2) { setStep(s => s + 1); setSubmitError(null); return; }

    if (!validateNotificacoes()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const booking = await handleSaveNovoAgendamento(dados);
      setSavedBooking(booking);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro ao salvar agendamento.';
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  };

  const canAdvance = step === 1 ? isDadosValid(dados) : true;

  if (savedBooking) {
    return (
      <ConfirmationVoucher
        booking={savedBooking}
        onNew={() => { setSavedBooking(null); setStep(1); setDados(INITIAL_DADOS); setNotificacoes(INITIAL_NOTIFICACOES); }}
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
        <div className="px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('agendar')}
            className={`flex-1 text-xs font-bold py-2.5 rounded-lg border transition-colors ${mode === 'agendar' ? 'bg-[#ED6A23] text-white border-[#ED6A23]' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
          >
            Eu mesmo vou agendar
          </button>
          <button
            type="button"
            onClick={() => setMode('atribuir')}
            className={`flex-1 text-xs font-bold py-2.5 rounded-lg border transition-colors ${mode === 'atribuir' ? 'bg-[#ED6A23] text-white border-[#ED6A23]' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
          >
            Atribuir a uma transportadora
          </button>
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
            {step === 1 && <DadosStep data={dados} onChange={handleDadosChange} disabled={saving} />}
            {step === 2 && <NotificacoesStep data={notificacoes} onChange={setNotificacoes} errors={notifErrors} disabled={saving} />}
          </div>

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
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : step < 2 ? 'Próximo' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
