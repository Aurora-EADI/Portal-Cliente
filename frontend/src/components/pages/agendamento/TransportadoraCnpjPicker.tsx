'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, Loader2, Plus, Search, Truck, X } from 'lucide-react';
import { Transportadora } from '@/types/agendamento';
import { UserRole } from '@/types';
import { formatCNPJ, formatPhone } from '@/lib/agendamento';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { useAuthContext } from '@/context/AuthContext';
import { useAgendamento } from '@/context/AgendamentoContext';

const INPUT = 'w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800';
const LABEL = 'text-xs font-bold text-zinc-600 block mb-1.5';

const MSG_FORA_DO_SIAUM =
  'Transportador não encontrado no cadastro da Aurora (SIAUM). Entre em contato com o time de suporte da Aurora.';

interface TransportadoraCnpjPickerProps {
  /** "Meus transportadores" para cliente/despachante (já filtrado pela API). */
  transportadoras: Transportadora[];
  cnpj: string;
  nome: string;
  onChangeCnpj: (v: string) => void;
  onChangeNome: (v: string) => void;
  email?: string;
  onChangeEmail?: (v: string) => void;
  whatsapp?: string;
  onChangeWhatsapp?: (v: string) => void;
  // Quando o consumidor guarda nome/cnpj/email/whatsapp num objeto só (não em
  // useState separados), as 4 chamadas onChange* sequenciais pisam uma na outra
  // (cada uma fecha sobre o mesmo estado stale). onSelect/onClear entregam tudo
  // numa chamada atômica só pra esses casos.
  onSelect?: (t: Transportadora) => void;
  onClear?: () => void;
}

type BuscaCnpj =
  | { estado: 'idle' }
  | { estado: 'buscando'; cnpj: string }
  | { estado: 'encontrado'; cnpj: string; transportadora: Transportadora }
  | { estado: 'nao_encontrado'; cnpj: string; mensagem: string }
  | { estado: 'erro'; cnpj: string; mensagem: string };

export function TransportadoraCnpjPicker({ transportadoras, cnpj, nome, onChangeCnpj, onChangeNome, email, onChangeEmail, whatsapp, onChangeWhatsapp, onSelect, onClear }: TransportadoraCnpjPickerProps) {
  const { currentUser } = useAuthContext();
  const { reloadTransportadorasConta } = useAgendamento();
  // Cliente e despachante não veem a lista SIAUM inteira: buscam por CNPJ e
  // salvam em "Meus transportadores".
  const buscaPorCnpj = currentUser?.role === UserRole.CLIENTE || currentUser?.role === UserRole.DESPACHANTE;

  const pickable = useMemo(
    () => transportadoras.filter(t => t.cnpj && t.cnpj.replace(/\D/g, '').length === 14),
    [transportadoras]
  );

  const [search, setSearch] = useState(cnpj && nome ? `${nome} — ${formatCNPJ(cnpj)}` : '');
  const [focused, setFocused] = useState(false);
  const [locked, setLocked] = useState(!!(cnpj && nome));
  const [busca, setBusca] = useState<BuscaCnpj>({ estado: 'idle' });
  const [salvando, setSalvando] = useState(false);

  const searchDigits = search.replace(/\D/g, '');

  const suggestions = focused && search.length > 0
    ? pickable.filter(t => {
        const q = search.toLowerCase();
        const nomeMatch = t.nome.toLowerCase().includes(q);
        const cnpjMatch = searchDigits.length > 0 && (t.cnpj ?? '').replace(/\D/g, '').includes(searchDigits);
        return nomeMatch || cnpjMatch;
      })
    : [];

  const selectTransportadora = useCallback((t: Transportadora) => {
    if (onSelect) {
      onSelect(t);
    } else {
      onChangeNome(t.nome);
      onChangeCnpj(t.cnpj!.replace(/\D/g, ''));
      onChangeEmail?.(t.email ?? '');
      onChangeWhatsapp?.(t.whatsapp ?? '');
    }
    setSearch(`${t.nome} — ${formatCNPJ(t.cnpj!)}`);
    setLocked(true);
    setBusca({ estado: 'idle' });
  }, [onSelect, onChangeNome, onChangeCnpj, onChangeEmail, onChangeWhatsapp]);

  // Consumidores passam onSelect inline (identidade nova a cada render); o
  // efeito abaixo lê pela ref para não refazer a busca a cada render.
  const selectRef = useRef(selectTransportadora);
  useEffect(() => { selectRef.current = selectTransportadora; }, [selectTransportadora]);

  // CNPJ completo: se já está em "Meus transportadores", seleciona; senão
  // (cliente/despachante) consulta a lista SIAUM.
  useEffect(() => {
    if (locked) return;
    if (searchDigits.length !== 14) {
      setBusca(b => (b.estado === 'idle' ? b : { estado: 'idle' }));
      return;
    }
    const exact = pickable.find(t => (t.cnpj ?? '').replace(/\D/g, '') === searchDigits);
    if (exact) { selectRef.current(exact); return; }
    if (!buscaPorCnpj) return;

    let cancelado = false;
    setBusca({ estado: 'buscando', cnpj: searchDigits });
    api.get('/agendamento/transportadoras-conta/buscar', { params: { cnpj: searchDigits } })
      .then(({ data }) => {
        if (cancelado) return;
        if (!data?.encontrado) {
          setBusca({ estado: 'nao_encontrado', cnpj: searchDigits, mensagem: data?.mensagem || MSG_FORA_DO_SIAUM });
        } else {
          setBusca({ estado: 'encontrado', cnpj: searchDigits, transportadora: data.transportadora });
        }
      })
      .catch(err => {
        if (!cancelado) setBusca({ estado: 'erro', cnpj: searchDigits, mensagem: getErrorMessage(err) });
      });
    return () => { cancelado = true; };
  }, [searchDigits, locked, pickable, buscaPorCnpj]);

  const salvarEmMeusTransportadores = async (t: Transportadora) => {
    setSalvando(true);
    try {
      const { data } = await api.post('/agendamento/transportadoras-conta/vinculos', { cnpj: t.cnpj });
      await reloadTransportadorasConta();
      selectTransportadora(data ?? t);
    } catch (err) {
      setBusca({ estado: 'erro', cnpj: (t.cnpj ?? '').replace(/\D/g, ''), mensagem: getErrorMessage(err) });
    } finally {
      setSalvando(false);
    }
  };

  const clearSelection = () => {
    if (onClear) {
      onClear();
    } else {
      onChangeNome('');
      onChangeCnpj('');
      onChangeEmail?.('');
      onChangeWhatsapp?.('');
    }
    setSearch('');
    setLocked(false);
    setBusca({ estado: 'idle' });
  };

  if (!buscaPorCnpj && pickable.length === 0) {
    return (
      <div>
        <label className={LABEL}>Transportadora *</label>
        <p className="text-xs text-zinc-400 border border-zinc-200 rounded-lg px-3 py-2 bg-zinc-50">
          Nenhuma transportadora sincronizada do SIAUM ainda. Aguarde a próxima sincronização.
        </p>
      </div>
    );
  }

  const placeholder = buscaPorCnpj
    ? (pickable.length ? 'Buscar em meus transportadores ou informar CNPJ...' : 'Informe o CNPJ do transportador...')
    : 'Buscar por nome ou CNPJ...';

  return (
    <div>
      <label className={LABEL}>Transportadora *</label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          readOnly={locked}
          className={INPUT + ' pl-8' + (locked ? ' bg-zinc-50' : '')}
        />
        {locked && (
          <button type="button" onClick={clearSelection} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {buscaPorCnpj && !locked && pickable.length === 0 && busca.estado === 'idle' && (
        <p className="text-[10px] text-zinc-400 mt-1">
          Você ainda não tem transportadores salvos. Informe o CNPJ para buscar no cadastro da Aurora.
        </p>
      )}
      {!locked && focused && suggestions.length > 0 && (
        <div className="mt-1 border border-zinc-200 rounded-lg shadow-sm bg-white overflow-hidden max-h-60 overflow-y-auto">
          {buscaPorCnpj && (
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400 bg-zinc-50 border-b border-zinc-100">
              Meus transportadores
            </p>
          )}
          {suggestions.map(t => (
            <button
              key={t.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); selectTransportadora(t); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2 border-b border-zinc-100 last:border-0"
            >
              <Truck className="w-3 h-3 text-zinc-400" />
              <span className="text-zinc-800 font-semibold truncate">{t.nome}</span>
              <span className="text-zinc-400 font-mono text-[10px]">{formatCNPJ(t.cnpj!)}</span>
            </button>
          ))}
        </div>
      )}

      {!locked && busca.estado === 'buscando' && (
        <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando CNPJ no cadastro da Aurora...
        </p>
      )}

      {!locked && busca.estado === 'encontrado' && (
        <div className="mt-2 border border-sky-200 bg-sky-50 rounded-lg p-3 text-xs space-y-1">
          <p className="flex items-center gap-1.5 font-bold text-zinc-800">
            <Truck className="w-3.5 h-3.5 text-sky-600" /> {busca.transportadora.nome}
          </p>
          <p className="text-zinc-600"><span className="font-semibold">CNPJ:</span> <span className="font-mono">{formatCNPJ(busca.transportadora.cnpj ?? '')}</span></p>
          {busca.transportadora.email && <p className="text-zinc-600"><span className="font-semibold">E-mail:</span> {busca.transportadora.email}</p>}
          {busca.transportadora.telefone && <p className="text-zinc-600"><span className="font-semibold">Telefone:</span> {busca.transportadora.telefone}</p>}
          <button
            type="button"
            disabled={salvando}
            onClick={() => salvarEmMeusTransportadores(busca.transportadora)}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 disabled:opacity-60"
          >
            {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Salvar em meus transportadores
          </button>
        </div>
      )}

      {!locked && (busca.estado === 'nao_encontrado' || busca.estado === 'erro') && (
        <div className="mt-2 border border-amber-200 bg-amber-50 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{busca.mensagem}</span>
        </div>
      )}

      {locked && onChangeEmail && (
        <div className="mt-3">
          <label className={LABEL}>E-mail para envio do convite</label>
          <input
            type="email"
            value={email ?? ''}
            onChange={(e) => onChangeEmail(e.target.value)}
            placeholder="contato@transportadora.com.br"
            className={INPUT}
          />
          <p className="text-[10px] text-zinc-400 mt-1">Usado só se essa transportadora ainda não tiver acesso ao portal.</p>
        </div>
      )}
      {locked && onChangeWhatsapp && (
        <div className="mt-3">
          <label className={LABEL}>WhatsApp para notificação</label>
          <input
            type="text"
            value={whatsapp ?? ''}
            onChange={(e) => onChangeWhatsapp(formatPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            className={INPUT}
          />
          <p className="text-[10px] text-zinc-400 mt-1">Transportadora recebe um aviso por WhatsApp quando for atribuída a uma DI.</p>
        </div>
      )}
    </div>
  );
}
