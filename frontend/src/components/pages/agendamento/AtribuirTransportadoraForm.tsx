'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Truck } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { api } from '@/lib/api';
import { TransportadoraCnpjPicker } from './TransportadoraCnpjPicker';

const INPUT = 'w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800';
const LABEL = 'text-xs font-bold text-zinc-600 block mb-1.5';

function parseContainers(containerStr: string): string[] {
  if (!containerStr) return [];
  return containerStr.split('/').map(c => c.trim()).filter(Boolean);
}

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
  const searchParams = useSearchParams();

  const [nLote, setNLote] = useState('');
  const [container, setContainer] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  const diSelecionada = useMemo(() => availableDis.find(d => d.nLote === nLote), [availableDis, nLote]);
  const containersDaDi = useMemo(() => diSelecionada ? parseContainers(diSelecionada.container) : [], [diSelecionada]);

  useEffect(() => {
    if (autoFilled || availableDis.length === 0) return;
    const diNumero = searchParams.get('diNumero');
    if (!diNumero) return;
    const di = availableDis.find(d => d.numeroDI === diNumero);
    if (!di) return;
    setNLote(di.nLote!);
    const urlContainer = searchParams.get('container') || '';
    const containers = parseContainers(di.container);
    if (urlContainer) setContainer(urlContainer);
    else if (containers.length === 1) setContainer(containers[0]);
    setAutoFilled(true);
  }, [availableDis, searchParams, autoFilled]);

  // Trocou de DI: reseta o container escolhido (ou auto-seleciona se só tiver um)
  const handleChangeDi = (novoLote: string) => {
    setNLote(novoLote);
    const di = availableDis.find(d => d.nLote === novoLote);
    const containers = di ? parseContainers(di.container) : [];
    setContainer(containers.length === 1 ? containers[0] : '');
  };

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ConviteInfo | null>(null);

  const handleAtribuir = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nLote) { setError('Selecione uma DI.'); return; }
    if (containersDaDi.length > 0 && !container) { setError('Selecione o container que está atribuindo.'); return; }
    const cnpjDigits = cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) { setError('Selecione uma transportadora.'); return; }

    setSaving(true);
    try {
      const { data } = await api.post('/agendamento/atribuicoes', {
        nLote,
        container,
        cnpj: cnpjDigits,
        nome: nome.trim(),
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
      });
      setResult(data.convite ?? { status: 'has_access' });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao atribuir transportadora.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNLote(''); setContainer(''); setCnpj(''); setNome(''); setEmail(''); setWhatsapp('');
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
            {container && (
              <p className="text-xs text-emerald-700 mt-1">
                Container atribuído: <span className="font-mono font-bold">{container}</span>
                {diSelecionada && <> — DI {diSelecionada.numeroDI}</>}
              </p>
            )}
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
        <select value={nLote} onChange={(e) => handleChangeDi(e.target.value)} className={INPUT}>
          <option value="">Selecione uma DI...</option>
          {availableDis.map(di => (
            <option key={di.id} value={di.nLote}>{di.numeroDI} — {di.cliente}</option>
          ))}
        </select>
        {availableDis.length === 0 && (
          <p className="text-[11px] text-zinc-400 mt-1">Nenhuma DI liberada disponível no momento.</p>
        )}
      </div>

      {nLote && containersDaDi.length > 0 && (
        <div>
          <label className={LABEL}>Container *</label>
          {containersDaDi.length === 1 ? (
            <div className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg text-sm font-mono font-semibold text-emerald-800">
              {containersDaDi[0]}
            </div>
          ) : (
            <div className="space-y-1.5">
              {containersDaDi.map(ctnr => (
                <button
                  key={ctnr}
                  type="button"
                  onClick={() => setContainer(ctnr)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-mono font-semibold transition-colors ${container === ctnr ? 'border-[#ED6A23] bg-[#ED6A23]/5 text-[#ED6A23]' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}
                >
                  {ctnr}
                </button>
              ))}
            </div>
          )}
          <p className="text-[11px] text-zinc-400 mt-1">A transportadora só vai enxergar e agendar este container.</p>
        </div>
      )}

      {nLote && containersDaDi.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700">Nenhum container vinculado a esta DI — a atribuição valerá pra DI inteira.</p>
        </div>
      )}

      <TransportadoraCnpjPicker
        transportadoras={transportadorasConta}
        cnpj={cnpj}
        nome={nome}
        onChangeCnpj={setCnpj}
        onChangeNome={setNome}
        email={email}
        onChangeEmail={setEmail}
        whatsapp={whatsapp}
        onChangeWhatsapp={setWhatsapp}
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
