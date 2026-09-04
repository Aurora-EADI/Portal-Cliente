'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Truck } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { api } from '@/lib/api';
import { TransportadoraCnpjPicker } from './TransportadoraCnpjPicker';

const INPUT = 'w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800';
const LABEL = 'text-xs font-bold text-zinc-600 block mb-1.5';
const TODOS_CONTAINERS = '__TODOS__';

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

interface ResultadoContainer {
  container: string;
  ok: boolean;
  convite?: ConviteInfo;
  erro?: string;
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
  const [resultados, setResultados] = useState<ResultadoContainer[] | null>(null);

  const handleAtribuir = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nLote) { setError('Selecione uma DI.'); return; }
    if (containersDaDi.length > 0 && !container) { setError('Selecione o container que está atribuindo.'); return; }
    const cnpjDigits = cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) { setError('Selecione uma transportadora.'); return; }

    const containersParaAtribuir = container === TODOS_CONTAINERS ? containersDaDi : [container];

    setSaving(true);
    try {
      const saida: ResultadoContainer[] = [];
      for (const ctnr of containersParaAtribuir) {
        try {
          const { data } = await api.post('/agendamento/atribuicoes', {
            nLote,
            container: ctnr,
            cnpj: cnpjDigits,
            nome: nome.trim(),
            email: email.trim() || undefined,
            whatsapp: whatsapp.trim() || undefined,
          });
          saida.push({ container: ctnr, ok: true, convite: data.convite ?? { status: 'has_access' } });
        } catch (err: any) {
          saida.push({ container: ctnr, ok: false, erro: err?.response?.data?.message ?? 'Erro ao atribuir transportadora.' });
        }
      }
      setResultados(saida);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNLote(''); setContainer(''); setCnpj(''); setNome(''); setEmail(''); setWhatsapp('');
    setError(''); setResultados(null);
  };

  if (resultados) {
    const sucessos = resultados.filter(r => r.ok);
    const falhas = resultados.filter(r => !r.ok);
    return (
      <div className="p-6 space-y-4 animate-in fade-in">
        {sucessos.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800">
                {sucessos.length > 1 ? `${sucessos.length} containers atribuídos!` : 'Transportadora atribuída!'}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                {diSelecionada && <>DI {diSelecionada.numeroDI} — </>}
                {sucessos.map(s => s.container).filter(Boolean).length > 0
                  ? <>Container(s): <span className="font-mono font-bold">{sucessos.map(s => s.container).join(', ')}</span></>
                  : 'atribuição registrada para a DI inteira.'}
              </p>
              {sucessos.some(s => s.convite && s.convite.status !== 'has_access') && (
                <p className="text-xs text-emerald-700 mt-1">
                  Como essa transportadora ainda não tem acesso ao portal, um convite foi gerado. Ela já vai enxergar esta DI para agendar a retirada assim que aceitar.
                </p>
              )}
            </div>
          </div>
        )}

        {falhas.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-bold text-red-800 mb-1.5">
              {falhas.length > 1 ? `${falhas.length} containers não puderam ser atribuídos` : 'Container não pôde ser atribuído'}
            </p>
            <ul className="space-y-0.5">
              {falhas.map(f => (
                <li key={f.container} className="text-xs text-red-700">
                  <span className="font-mono font-bold">{f.container}</span> — {f.erro}
                </li>
              ))}
            </ul>
          </div>
        )}

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
              <button
                type="button"
                onClick={() => setContainer(TODOS_CONTAINERS)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-bold transition-colors ${container === TODOS_CONTAINERS ? 'border-[#ED6A23] bg-[#ED6A23]/5 text-[#ED6A23]' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}
              >
                Todos os containers ({containersDaDi.length})
              </button>
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
          <p className="text-[11px] text-zinc-400 mt-1">
            {container === TODOS_CONTAINERS
              ? 'A transportadora vai enxergar e agendar todos os containers desta DI.'
              : 'A transportadora só vai enxergar e agendar este container.'}
          </p>
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
