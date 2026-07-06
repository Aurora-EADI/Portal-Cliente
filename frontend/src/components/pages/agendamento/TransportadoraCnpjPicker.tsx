'use client';

import React, { useMemo, useState } from 'react';
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
}

export function TransportadoraCnpjPicker({ transportadoras, cnpj, nome, onChangeCnpj, onChangeNome }: TransportadoraCnpjPickerProps) {
  const pickable = useMemo(
    () => transportadoras.filter(t => t.cnpj && t.cnpj.replace(/\D/g, '').length === 14),
    [transportadoras]
  );

  const [manualMode, setManualMode] = useState(pickable.length === 0);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [locked, setLocked] = useState(false);

  const suggestions = focused && search.length > 0
    ? pickable.filter(t => {
        const q = search.toLowerCase();
        return t.nome.toLowerCase().includes(q) || (t.cnpj ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      })
    : [];

  const selectTransportadora = (t: Transportadora) => {
    onChangeNome(t.nome);
    onChangeCnpj(t.cnpj!.replace(/\D/g, ''));
    setSearch(`${t.nome} — ${formatCNPJ(t.cnpj!)}`);
    setLocked(true);
  };

  const clearSelection = () => {
    onChangeNome('');
    onChangeCnpj('');
    setSearch('');
    setLocked(false);
  };

  if (manualMode) {
    return (
      <>
        <div>
          <label className={LABEL}>CNPJ da Transportadora *</label>
          <input type="text" value={cnpj} onChange={(e) => onChangeCnpj(formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18}
            className={INPUT + ' font-mono'} />
        </div>
        <div>
          <label className={LABEL}>Nome da Transportadora *</label>
          <input type="text" value={nome} onChange={(e) => onChangeNome(e.target.value)} placeholder="Razão social ou nome fantasia"
            className={INPUT} />
        </div>
        {pickable.length > 0 && (
          <button
            type="button"
            onClick={() => { setManualMode(false); clearSelection(); }}
            className="text-[11px] font-bold text-[#ED6A23] hover:underline"
          >
            Escolher transportadora já cadastrada
          </button>
        )}
      </>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={LABEL} style={{ marginBottom: 0 }}>Transportadora *</label>
        <button
          type="button"
          onClick={() => { setManualMode(true); clearSelection(); }}
          className="text-[11px] font-bold text-[#ED6A23] hover:underline"
        >
          Não encontrou? Cadastrar manualmente
        </button>
      </div>
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
    </div>
  );
}
