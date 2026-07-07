'use client';

import React, { useState } from 'react';
import { CheckCircle, Truck } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { api } from '@/lib/api';
import { TransportadoraCnpjPicker } from './TransportadoraCnpjPicker';

const INPUT = 'w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800';
const LABEL = 'text-xs font-bold text-zinc-600 block mb-1.5';

interface AtribuirTransportadoraFormProps {
  onBack: () => void;
}

interface ConviteInfo {
  status: 'has_access' | 'pending' | 'created';
  link?: string;
  emailSent?: boolean;
}

export function AtribuirTransportadoraForm({ onBack }: AtribuirTransportadoraFormProps) {
  const { visibleDis, transportadorasConta } = useAgendamento();
  const availableDis = visibleDis.filter(d => d.status === 'liberada' && d.nLote);

  const [nLote, setNLote] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ConviteInfo | null>(null);

  const handleAtribuir = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nLote) { setError('Selecione uma DI.'); return; }
    const cnpjDigits = cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) { setError('Selecione uma transportadora.'); return; }

    setSaving(true);
    try {
      const { data } = await api.post('/agendamento/atribuicoes', {
        nLote,
        cnpj: cnpjDigits,
        nome: nome.trim(),
        email: email.trim() || undefined,
      });
      setResult(data.convite ?? { status: 'has_access' });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao atribuir transportadora.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNLote(''); setCnpj(''); setNome(''); setEmail('');
    setError(''); setResult(null);
  };

  if (result) {
    const convidou = result.status !== 'has_access';
    return (
      <div className="p-6 space-y-4 animate-in fade-in">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">
              {convidou ? 'Transportadora atribuída — convite enviado!' : 'Transportadora atribuída!'}
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              {convidou
                ? result.status === 'pending'
                  ? 'Essa transportadora já tinha um convite pendente — ela poderá aceitá-lo e já vai enxergar esta DI para agendar a retirada.'
                  : 'Como essa transportadora ainda não tem acesso ao portal, um convite foi gerado e ' + (result.emailSent ? 'enviado por e-mail. ' : 'precisa ser compartilhado manualmente (sem e-mail cadastrado). ') + 'Ela já vai enxergar esta DI para agendar a retirada assim que aceitar.'
                : 'A transportadora já vai enxergar esta DI para agendar a retirada assim que acessar o portal.'}
            </p>
            {result.link && (
              <p className="text-[11px] font-mono text-emerald-600 mt-2 break-all">{result.link}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset} className="px-4 py-2 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">
            Atribuir outra DI
          </button>
          <button onClick={onBack} className="px-4 py-2 bg-[#ED6A23] hover:bg-[#D45917] text-white rounded-lg font-bold text-xs shadow-sm">
            Ver agendamentos
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleAtribuir} className="p-6 space-y-4 text-sm animate-in fade-in">
      <p className="text-xs text-zinc-500">
        Escolha a DI e a transportadora responsável pela retirada. Se ela ainda não tiver acesso ao
        portal, um convite é enviado automaticamente por e-mail.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 font-semibold text-xs">• {error}</div>
      )}

      <div>
        <label className={LABEL}>Declaração de Importação (DI) *</label>
        <select value={nLote} onChange={(e) => setNLote(e.target.value)} className={INPUT}>
          <option value="">Selecione uma DI...</option>
          {availableDis.map(di => (
            <option key={di.id} value={di.nLote}>{di.numeroDI} — {di.cliente}</option>
          ))}
        </select>
        {availableDis.length === 0 && (
          <p className="text-[11px] text-zinc-400 mt-1">Nenhuma DI liberada disponível no momento.</p>
        )}
      </div>

      <TransportadoraCnpjPicker
        transportadoras={transportadorasConta}
        cnpj={cnpj}
        nome={nome}
        onChangeCnpj={setCnpj}
        onChangeNome={setNome}
        email={email}
        onChangeEmail={setEmail}
      />

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onBack} className="px-4 py-2 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ED6A23] hover:bg-[#D45917] text-white rounded-lg font-bold text-xs shadow-sm disabled:opacity-60">
          <Truck className="w-3.5 h-3.5" />
          {saving ? 'Salvando...' : 'Atribuir Transportadora'}
        </button>
      </div>
    </form>
  );
}
