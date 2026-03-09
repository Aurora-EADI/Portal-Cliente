'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileEdit,
  Send,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Eye,
  MoreHorizontal,
  User,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchBar } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/DataTable';
import { Kanban, KanbanColumnConfig } from '@/components/ui/Kanban';
import { useSimulations, useChangeSimulationStatus } from '@/hooks/useSimulations';
import { SimulationListItem, SimulationStatus, SimulationVersionSummary } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCurrentVersion(item: SimulationListItem): SimulationVersionSummary | undefined {
  return item.versions?.find((v) => v.isCurrentVersion);
}

function formatCurrency(value?: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Pipeline Columns ───────────────────────────────────────────────────────

interface PipelineColumn {
  id: SimulationStatus;
  /** Statuses que são exibidos nesta coluna */
  statuses: SimulationStatus[];
  title: string;
  colorClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE: PipelineColumn[] = [
  {
    id: SimulationStatus.DRAFT,
    statuses: [SimulationStatus.DRAFT, SimulationStatus.PENDING],
    title: 'Em Elaboração',
    colorClass: 'bg-slate-500',
    icon: FileEdit,
  },
  {
    id: SimulationStatus.IN_VALIDATION,
    statuses: [SimulationStatus.IN_VALIDATION],
    title: 'Em Validação',
    colorClass: 'bg-amber-500',
    icon: ClipboardList,
  },
  {
    id: SimulationStatus.SENT,
    statuses: [SimulationStatus.SENT],
    title: 'Enviada ao Cliente',
    colorClass: 'bg-blue-500',
    icon: Send,
  },
  {
    id: SimulationStatus.APPROVED,
    statuses: [SimulationStatus.APPROVED],
    title: 'Aprovada',
    colorClass: 'bg-teal-500',
    icon: ShieldCheck,
  },
  {
    id: SimulationStatus.ACCEPTED,
    statuses: [SimulationStatus.ACCEPTED],
    title: 'Aceita',
    colorClass: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  {
    id: SimulationStatus.REJECTED,
    statuses: [SimulationStatus.REJECTED],
    title: 'Recusada',
    colorClass: 'bg-red-500',
    icon: XCircle,
  },
];

// ─── Proposal Card ───────────────────────────────────────────────────────────

interface PropostaCardProps {
  item: SimulationListItem;
  onView: (item: SimulationListItem) => void;
  onMoveStatus: (versionId: string, status: SimulationStatus) => void;
}

function PropostaCard({ item, onView, onMoveStatus }: PropostaCardProps) {
  const version = getCurrentVersion(item);

  const statusTargets = PIPELINE.filter(
    (col) => !col.statuses.includes(version?.status ?? SimulationStatus.DRAFT),
  );

  return (
    <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow duration-200 cursor-default">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-mono text-slate-400">{version?.displayNumber ?? item.simulationNumber}</p>
          <p className="font-semibold text-slate-800 text-sm leading-tight mt-0.5 line-clamp-1">
            {item.customer?.name ?? '—'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-slate-400 hover:text-slate-700">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => onView(item)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver / Editar Proposta
            </DropdownMenuItem>
            {statusTargets.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {statusTargets.map((col) => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => version && onMoveStatus(version.id, col.id)}
                    disabled={!version}
                  >
                    <col.icon className="h-4 w-4 mr-2 text-slate-500" />
                    Mover para: {col.title}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Value */}
      <div className="flex items-center gap-1.5 mb-2">
        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-sm font-bold text-slate-700">
          {formatCurrency(version?.totalGeneral)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{formatDate(item.createdAt)}</span>
        </div>
        {version?.user && (
          <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 font-medium">
            <User className="h-2.5 w-2.5" />
            {version.user.name.split(' ')[0]}
          </Badge>
        )}
      </div>
    </Card>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function PropostasKanban() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: simulations = [], isLoading } = useSimulations();
  const changeStatus = useChangeSimulationStatus();

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return simulations;
    const term = searchTerm.toLowerCase();
    return simulations.filter(
      (s) =>
        s.simulationNumber.toLowerCase().includes(term) ||
        s.customer?.name.toLowerCase().includes(term) ||
        s.customer?.document?.toLowerCase().includes(term),
    );
  }, [simulations, searchTerm]);

  const columns: KanbanColumnConfig<SimulationListItem>[] = useMemo(
    () =>
      PIPELINE.map((col) => ({
        id: col.id,
        title: col.title,
        colorClass: col.colorClass,
        icon: col.icon as any,
        items: filtered.filter((s) => {
          const status = getCurrentVersion(s)?.status;
          return col.statuses.includes(status ?? SimulationStatus.DRAFT);
        }),
      })),
    [filtered],
  );

  const handleView = (item: SimulationListItem) => {
    router.push(`/comercial/simulador?id=${item.id}`);
  };

  const handleMoveStatus = (versionId: string, status: SimulationStatus) => {
    changeStatus.mutate({ id: versionId, status });
  };

  const handleCardMove = (draggableId: string, toColumnId: string) => {
    changeStatus.mutate({ id: draggableId, status: toColumnId as SimulationStatus });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Pipeline de Propostas"
        description="Acompanhe o funil de propostas comerciais por estágio."
      />

      <div className="max-w-sm">
        <SearchBar
          placeholder="Buscar por número, cliente ou CNPJ..."
          onSearch={(v) => { setSearchTerm(v); }}
          onClear={() => setSearchTerm('')}
          showClearButton={!!searchTerm}
        />
      </div>

      <Kanban
        columns={columns}
        keyExtractor={(item) => getCurrentVersion(item)?.id ?? item.id}
        isLoading={isLoading}
        onCardMove={handleCardMove}
        renderCard={(item) => (
          <PropostaCard
            item={item}
            onView={handleView}
            onMoveStatus={handleMoveStatus}
          />
        )}
      />
    </div>
  );
}
