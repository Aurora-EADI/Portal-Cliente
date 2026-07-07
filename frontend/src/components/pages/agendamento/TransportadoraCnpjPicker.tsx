'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Search, Truck, X } from 'lucide-react';
import { Transportadora } from '@/types/agendamento';
import { formatCNPJ } from '@/lib/agendamento';

const INPUT = 'w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800';
const LABEL = 'text-xs font-bold text-zinc-600 block mb-1.5';

interface TransportadoraCnpjPickerProps {
  transportadoras: Transportadora[];
  cnpj: string;
  nome: string;
  onChangeCnpj: (v: string) => void;
  onChangeNome: (v: string) => void;
  email?: string;
  onChangeEmail?: (v: string) => void;
}

export function TransportadoraCnpjPicker({ transportadoras, cnpj, nome, onChangeCnpj, onChangeNome, email, onChangeEmail }: TransportadoraCnpjPickerProps) {
  const pickable = useMemo(
    () => transportadoras.filter(t => t.cnpj && t.cnpj.replace(/\D/g, '').length === 14),
    [transportadoras]
  );

  const [search, setSearch] = useState(cnpj && nome ? `${nome} — ${formatCNPJ(cnpj)}` : '');
  const [focused, setFocused] = useState(false);
  const [locked, setLocked] = useState(!!(cnpj && nome));

  const suggestions = focused && search.length > 0
    ? pickable.filter(t => {
        const q = search.toLowerCase();
        return t.nome.toLowerCase().includes(q) || (t.cnpj ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      })
    : [];

  const selectTransportadora = (t: Transportadora) => {
    onChangeNome(t.nome);
    onChangeCnpj(t.cnpj!.replace(/\D/g, ''));
    onChangeEmail?.(t.email ?? '');
    setSearch(`${t.nome} — ${formatCNPJ(t.cnpj!)}`);
    setLocked(true);
  };

  useEffect(() => {
    if (locked) return;
    const digits = search.replace(/\D/g, '');
    if (digits.length !== 14) return;
    const exact = pickable.find(t => (t.cnpj ?? '').replace(/\D/g, '') === digits);
    if (exact) selectTransportadora(exact);
  }, [search, locked, pickable]);

  const clearSelection = () => {
    onChangeNome('');
    onChangeCnpj('');
    onChangeEmail?.('');
    setSearch('');
    setLocked(false);
  };

  if (pickable.length === 0) {
    return (
      <div>
        <label className={LABEL}>Transportadora *</label>
        <p className="text-xs text-zinc-400 border border-zinc-200 rounded-lg px-3 py-2 bg-zinc-50">
          Nenhuma transportadora sincronizada do SIAUM ainda. Aguarde a próxima sincronização.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className={LABEL}>Transportadora *</label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
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
      {!locked && focused && suggestions.length > 0 && (
        <div className="mt-1 border border-zinc-200 rounded-lg shadow-sm bg-white overflow-hidden">
          {suggestions.slice(0, 5).map(t => (
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
    </div>
  );
}
