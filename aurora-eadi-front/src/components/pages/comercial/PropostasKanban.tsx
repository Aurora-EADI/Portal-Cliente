'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Send,
  ShieldCheck,
  XCircle,
  Eye,
  MoreHorizontal,
  User,
  CalendarDays,
  DollarSign,
  Ship,
  Plane,
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
import { MultiSelect } from '@/components/ui/multi-select';
import { useSimulations, useChangeSimulationStatus } from '@/hooks/useSimulations';
import { useAirSimulations, useChangeAirSimulationStatus } from '@/hooks/useAirSimulations';
import { SimulationListItem, SimulationStatus, SimulationVersionSummary } from '@/types';
import { AirSimulation } from '@/types/air-simulation';

// ─── Unified Type ────────────────────────────────────────────────────────────

type ModalType = 'maritime' | 'air';

interface UnifiedSimulation {
  id: string;
  simulationNumber: string;
  customerId: string;
  customer?: { id: string; code: string; name: string; document: string };
  createdAt: string;
  updatedAt: string;
  modalType: ModalType;
  versions?: SimulationVersionSummary[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCurrentVersion(item: UnifiedSimulation): SimulationVersionSummary | undefined {
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

function normalizeAirSimulation(s: AirSimulation): UnifiedSimulation {
  return {
    id: s.id,
    simulationNumber: s.simulationNumber,
    customerId: s.customerId,
    customer: s.customer,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    modalType: 'air',
    versions: (s.versions ?? []).map((v) => ({
      id: v.id,
      version: v.version,
      displayNumber: v.displayNumber,
      isCurrentVersion: v.isCurrentVersion,
      status: v.status,
      totalGeneral: v.totalGeneral,
      createdAt: v.createdAt,
      user: v.user,
      _count: v._count,
    })),
  };
}

function normalizeMaritimeSimulation(s: SimulationListItem): UnifiedSimulation {
  return { ...s, modalType: 'maritime' };
}

// ─── Modal type config ───────────────────────────────────────────────────────

const MODAL_CONFIG: Record<ModalType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  borderClass: string;
  badgeClass: string;
}> = {
  maritime: {
    label: 'Marítima',
    icon: Ship,
    borderClass: 'border-l-4 border-l-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  air: {
    label: 'Aérea',
    icon: Plane,
    borderClass: 'border-l-4 border-l-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
};

// ─── Pipeline Columns ───────────────────────────────────────────────────────

interface PipelineColumn {
  id: SimulationStatus;
  statuses: SimulationStatus[];
  title: string;
  colorClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE: PipelineColumn[] = [
  {
    id: SimulationStatus.PENDING,
    statuses: [
      SimulationStatus.PENDING,
      SimulationStatus.DRAFT,
      SimulationStatus.IN_VALIDATION,
      SimulationStatus.ACCEPTED,
    ],
    title: 'Aguardando Definição',
    colorClass: 'bg-slate-400',
    icon: Clock,
  },
  {
    id: SimulationStatus.SENT,
    statuses: [SimulationStatus.SENT],
    title: 'Enviada',
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
    id: SimulationStatus.REJECTED,
    statuses: [SimulationStatus.REJECTED],
    title: 'Rejeitada',
    colorClass: 'bg-red-500',
    icon: XCircle,
  },
];

// ─── Proposal Card ───────────────────────────────────────────────────────────

interface PropostaCardProps {
  item: UnifiedSimulation;
  onView: (item: UnifiedSimulation) => void;
  onMoveStatus: (versionId: string, status: SimulationStatus, modalType: ModalType) => void;
}

function PropostaCard({ item, onView, onMoveStatus }: PropostaCardProps) {
  const version = getCurrentVersion(item);
  const modal = MODAL_CONFIG[item.modalType];
  const ModalIcon = modal.icon;

  const statusTargets = PIPELINE.filter(
    (col) => !col.statuses.includes(version?.status ?? SimulationStatus.DRAFT),
  );

  return (
    <Card className={`p-3 bg-white border border-slate-200 hover:shadow-md transition-shadow duration-200 cursor-default rounded-lg overflow-hidden ${modal.borderClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[10px] font-mono text-slate-400 leading-none">
              {version?.displayNumber ?? item.simulationNumber}
            </p>
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded border ${modal.badgeClass}`}>
              <ModalIcon className="h-2.5 w-2.5" />
              {modal.label}
            </span>
          </div>
          <p className="font-semibold text-slate-800 text-xs leading-tight line-clamp-1">
            {item.customer?.name ?? '—'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-slate-400 hover:text-slate-700">
              <MoreHorizontal className="h-3.5 w-3.5" />
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
                    onClick={() => version && onMoveStatus(version.id, col.id, item.modalType)}
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
      <div className="flex items-center gap-1 mb-2">
        <DollarSign className="h-3 w-3 text-slate-400" />
        <span className="text-xs font-bold text-slate-700">
          {formatCurrency(version?.totalGeneral)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
          <CalendarDays className="h-3 w-3" />
          <span>{formatDate(item.createdAt)}</span>
        </div>
        {version?.user && (
          <Badge variant="secondary" className="text-[9px] gap-0.5 px-1 py-0 font-medium">
            <User className="h-2 w-2" />
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: maritimeRaw = [], isLoading: loadingMaritime } = useSimulations();
  const { data: airRaw = [], isLoading: loadingAir } = useAirSimulations();
  const changeMaritimeStatus = useChangeSimulationStatus();
  const changeAirStatus = useChangeAirSimulationStatus();

  const isLoading = loadingMaritime || loadingAir;

  const simulations = useMemo<UnifiedSimulation[]>(() => [
    ...maritimeRaw.map(normalizeMaritimeSimulation),
    ...airRaw.map(normalizeAirSimulation),
  ], [maritimeRaw, airRaw]);

  const userOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const s of simulations) {
      const user = getCurrentVersion(s)?.user;
      if (user && !seen.has(user.id)) {
        seen.add(user.id);
        options.push({ value: user.id, label: user.name });
      }
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [simulations]);

  const filtered = useMemo(() => {
    let result = simulations;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.simulationNumber.toLowerCase().includes(term) ||
          s.customer?.name.toLowerCase().includes(term) ||
          s.customer?.document?.toLowerCase().includes(term),
      );
    }

    if (selectedUsers.length > 0) {
      result = result.filter((s) => {
        const userId = getCurrentVersion(s)?.user?.id;
        return userId ? selectedUsers.includes(userId) : false;
      });
    }

    return result;
  }, [simulations, searchTerm, selectedUsers]);

  const columns: KanbanColumnConfig<UnifiedSimulation>[] = useMemo(
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

  const handleView = (item: UnifiedSimulation) => {
    if (item.modalType === 'air') {
      router.push(`/aereo/simulador?id=${item.id}`);
    } else {
      router.push(`/comercial/simulador?id=${item.id}`);
    }
  };

  const handleMoveStatus = (versionId: string, status: SimulationStatus, modalType: ModalType) => {
    if (modalType === 'air') {
      changeAirStatus.mutate({ id: versionId, status });
    } else {
      changeMaritimeStatus.mutate({ id: versionId, status });
    }
  };

  const handleCardMove = (draggableId: string, toColumnId: string) => {
    const item = simulations.find((s) => getCurrentVersion(s)?.id === draggableId);
    if (item?.modalType === 'air') {
      changeAirStatus.mutate({ id: draggableId, status: toColumnId as SimulationStatus });
    } else {
      changeMaritimeStatus.mutate({ id: draggableId, status: toColumnId as SimulationStatus });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Pipeline de Cotações"
        description="Acompanhe o funil de cotações comerciais por estágio."
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-80">
          <SearchBar
            placeholder="Buscar por número, cliente ou CNPJ..."
            onSearch={(v) => { setSearchTerm(v); }}
            onClear={() => setSearchTerm('')}
            showClearButton={!!searchTerm}
          />
        </div>
        <div className="w-64">
          <MultiSelect
            options={userOptions}
            selected={selectedUsers}
            onChange={setSelectedUsers}
            placeholder="Filtrar por responsável..."
            searchPlaceholder="Buscar usuário..."
            emptyMessage="Nenhum usuário encontrado."
          />
        </div>
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
