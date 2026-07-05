'use client';

import React, { useState } from 'react';
import { CheckCircle, Send, Truck, Plus } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { api } from '@/lib/api';

const INPUT = 'w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800';
const LABEL = 'text-xs font-bold text-zinc-600 block mb-1.5';

interface AtribuirTransportadoraFormProps {
  onBack: () => void;
}

export function AtribuirTransportadoraForm({ onBack }: AtribuirTransportadoraFormProps) {
  const { visibleDis } = useAgendamento();
  const availableDis = visibleDis.filter(d => d.status === 'liberada' && d.nLote);

  const [nLote, setNLote] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [nome, setNome] = useState('');
  const [showConvite, setShowConvite] = useState(false);
  const [email, setEmail] = useState('');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tipo: 'atribuido' | 'convite'; link?: string } | null>(null);

  const selectedDi = availableDis.find(d => d.nLote === nLote);

  const validateBase = () => {
    if (!nLote) { setError('Selecione uma DI.'); return false; }
    const cnpjDigits = cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) { setError('CNPJ inválido (14 dígitos).'); return false; }
    if (nome.trim().length < 3) { setError('Informe o nome da transportadora.'); return false; }
    return true;
  };

  const handleAtribuir = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateBase()) return;

    setSaving(true);
    try {
      await api.post('/agendamento/atribuicoes', {
        nLote,
        cnpj: cnpj.replace(/\D/g, ''),
        nome: nome.trim(),
      });
      setResult({ tipo: 'atribuido' });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao atribuir transportadora.');
    } finally {
      setSaving(false);
    }
  };

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateBase()) return;
    if (!email.trim().includes('@')) { setError('Informe um e-mail válido.'); return; }

    setSaving(true);
    try {
      const { data } = await api.post('/agendamento/convites-transportadora', {
        cnpj: cnpj.replace(/\D/g, ''),
        nome: nome.trim(),
        email: email.trim(),
      });
      // Atribui a DI assim que o convite é gerado — a transportadora já
      // encontra a DI liberada quando aceitar o convite e fizer login.
      await api.post('/agendamento/atribuicoes', {
        nLote,
        cnpj: cnpj.replace(/\D/g, ''),
        nome: nome.trim(),
      });
      setResult({ tipo: 'convite', link: data.link });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao convidar transportadora.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNLote(''); setCnpj(''); setNome(''); setEmail('');
    setShowConvite(false); setError(''); setResult(null);
  };

  if (result) {
    return (
      <div className="p-6 space-y-4 animate-in fade-in">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">
              {result.tipo === 'atribuido' ? 'Transportadora atribuída!' : 'Convite enviado e transportadora atribuída!'}
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              A transportadora {result.tipo === 'convite' ? 'poderá aceitar o convite e ' : ''}
              já vai enxergar esta DI para agendar a retirada assim que acessar o portal.
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
    <form onSubmit={showConvite ? handleConvidar : handleAtribuir} className="p-6 space-y-4 text-sm animate-in fade-in">
      <p className="text-xs text-zinc-500">
        Escolha a DI e informe a transportadora responsável pela retirada. Ela ganhará acesso
        para agendar assim que estiver com login ativo no portal.
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

      <div>
        <label className={LABEL}>CNPJ da Transportadora *</label>
        <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00"
          className={INPUT + ' font-mono'} />
      </div>

      <div>
        <label className={LABEL}>Nome da Transportadora *</label>
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Razão social ou nome fantasia"
          className={INPUT} />
      </div>

      {showConvite && (
        <div>
          <label className={LABEL}>E-mail para envio do convite *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@transportadora.com.br"
            className={INPUT} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowConvite(v => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ED6A23] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          {showConvite ? 'Já tenho o CNPJ cadastrado' : 'Transportadora ainda não tem acesso ao portal?'}
        </button>

        <div className="flex gap-2">
          <button type="button" onClick={onBack} className="px-4 py-2 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ED6A23] hover:bg-[#D45917] text-white rounded-lg font-bold text-xs shadow-sm disabled:opacity-60">
            {showConvite ? <Send className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
            {saving ? 'Salvando...' : showConvite ? 'Convidar e Atribuir' : 'Atribuir Transportadora'}
          </button>
        </div>
      </div>
    </form>
  );
}
