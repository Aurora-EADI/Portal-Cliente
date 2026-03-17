'use client';

import {
  ChevronLeft,
  Edit,
  Package,
  Ship,
  Calendar,
  DollarSign,
  Anchor,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { useProcesso } from '@/hooks/useDtaMaritime';
import { ProcessoImportacao } from '@/types/dtaMaritime';
import { formatDateBR } from '@/lib/date-format-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DtaProcessoDetailProps {
  processoId: string;
  onBack: () => void;
  onEdit: (processo: ProcessoImportacao) => void;
}

function formatCurrency(value?: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
    </div>
  );
}

function PortoIcon({ porto }: { porto?: string | null }) {
  if (porto === 'Chibatão') return <Anchor className="w-4 h-4" />;
  if (porto === 'Super Terminais') return <Building2 className="w-4 h-4" />;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DtaProcessoDetail({ processoId, onBack, onEdit }: DtaProcessoDetailProps) {
  const { data: processo, isLoading, isError } = useProcesso(processoId);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl w-56" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-40 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (isError || !processo) {
    return (
      <div className="text-center py-12 text-red-500 text-sm">
        Erro ao carregar processo. Tente novamente.
      </div>
    );
  }

  const allContainers = processo.containers ?? [];
  const totalContainers = allContainers.length;
  const totalBls = allContainers.reduce((acc, c) => acc + (c.bls?.length ?? 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-500 hover:text-slate-900 -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50">
              <Ship className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-mono">{processo.dta}</h2>
              <p className="text-sm text-slate-500">{processo.empresa}</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit(processo)} className="gap-2">
          <Edit className="w-4 h-4" />
          Editar
        </Button>
      </div>

      {/* ── Informações Gerais ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Informações Gerais
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <InfoField label="DTA" value={processo.dta} />
          <InfoField label="Empresa" value={processo.empresa} />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Porto
            </p>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <PortoIcon porto={processo.porto} />
              {processo.porto || '—'}
            </div>
          </div>
          <InfoField label="Navio" value={processo.navio} />
          <InfoField label="Transportador" value={processo.transportador} />
          <InfoField label="Comissária" value={processo.comissaria} />
        </div>
      </div>

      {/* ── Datas ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Datas
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <InfoField label="ATA DTA" value={formatDateBR(processo.ataDta)} />
          <InfoField label="ATA MAO" value={formatDateBR(processo.ataMao)} />
          <InfoField label="ATA EADI" value={formatDateBR(processo.ataEadi)} />
          <InfoField label="Conclusão" value={formatDateBR(processo.conclusao)} />
        </div>
      </div>

      {/* ── Valores Financeiros ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Valores Financeiros
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              FOB Total
            </p>
            <p className="text-base font-bold text-slate-800">{formatCurrency(processo.fobTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Frete Total
            </p>
            <p className="text-base font-bold text-slate-800">{formatCurrency(processo.freteTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              CIF Total
            </p>
            <p className="text-base font-bold text-primary-600">{formatCurrency(processo.cifTotal)}</p>
          </div>
        </div>
      </div>

      {/* ── Containers ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Containers
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{totalBls} H/HBL(s)</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {totalContainers} container{totalContainers !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {allContainers.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            Nenhum container cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {allContainers.map((c) => (
              <div
                key={c.id}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                {/* Container header */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="font-mono font-semibold text-slate-800 text-sm">
                    {c.number}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs font-bold font-mono">
                    {c.tipo}
                  </span>
                  <Badge variant="secondary" className="ml-auto font-mono text-xs">
                    {c.bls?.length ?? 0} H/HBL{(c.bls?.length ?? 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* BL list */}
                {c.bls && c.bls.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {c.bls.map((bl) => (
                      <div key={bl.id} className="flex items-center gap-2 px-4 py-2.5 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 flex-shrink-0">
                          H/HBL
                        </span>
                        <span className="font-mono text-sm text-slate-800">{bl.numero}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-xs text-slate-400">Sem H/HBL cadastrado.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
