'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plane,
  Calendar,
  Clock,
  Search,
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  History,
  Eye,
  Trash2,
  Edit,
  Folder,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useFlights, useDeleteFlight } from '@/hooks/useCcte';
import { Flight, FlightStatus } from '@/types/ccte';
import { NewFlightModal } from './modals/NewFlightModal';
import { EditFlightModal } from './modals/EditFlightModal';
import { FlightDetail } from './FlightDetail';
import { Badge } from '@/components/ui/Badge';
import { ActionButton } from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  Column,
  SearchBar,
  StatusCards,
  StatusCardConfig,
  PageHeader,
} from '@/components/ui/DataTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const STATUS_CARDS: StatusCardConfig[] = [
  {
    status: 'PENDING',
    label: 'Em Operacao',
    icon: Plane,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
  {
    status: 'SENT',
    label: 'Historico (Enviados)',
    icon: History,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
];

// Helper to get Month Name in Portuguese
const getMonthName = (monthIndex: number) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex];
};

import { parseLocaleDate, formatDateBR } from '@/lib/date-format-utils';

export function CcteDashboard() {
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [isNewFlightModalOpen, setIsNewFlightModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [flightToDelete, setFlightToDelete] = useState<Flight | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [limit, setLimit] = useState(10);
  const searchParams = useSearchParams();

  // Sync statusFilter and reset folder when navigating
  useEffect(() => {
    const status = searchParams.get('status');
    const newStatus = status === 'SENT' ? 'SENT' : 'PENDING';

    setStatusFilter(newStatus);
    setSearchTerm('');
    setPage(1);
  }, [searchParams]);

  const deleteFlightMutation = useDeleteFlight();

  const { data: flights = [], isLoading, isError } = useFlights(
    searchTerm.trim() || undefined,
    undefined // Fetch ALL flights to have accurate counts across cards
  );

  // Filter flights by period (shared logic for cards and folders)
  const flightsInPeriod = useMemo(() => {
    return flights.filter(f => {
      const d = parseLocaleDate(f.arrivalDate);
      if (!d) return false;

      const matchesYear = filterYear === 'all' || d.getFullYear().toString() === filterYear;
      const matchesMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;

      return matchesYear && matchesMonth;
    });
  }, [flights, filterMonth, filterYear]);

  // Group flights by Month/Year (respecting statusFilter locally)
  const groupedFolders = useMemo(() => {
    const groups: Record<string, { year: number, month: number, flights: Flight[] }> = {};

    // 1. Filter by status
    const filtered = statusFilter
      ? flightsInPeriod.filter(f => f.status === statusFilter)
      : flightsInPeriod;

    // 2. Group
    filtered.forEach(flight => {
      const date = parseLocaleDate(flight.arrivalDate);
      if (!date) return;

      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      if (!groups[key]) {
        groups[key] = { year, month, flights: [] };
      }
      groups[key].flights.push(flight);
    });

    // Sort folders by date descending
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, value]) => ({ key, ...value }));
  }, [flightsInPeriod, statusFilter]);

  // Auto-back to folders if current folder becomes empty (after deletion or filter change)
  useEffect(() => {
    if (selectedFolder) {
      const folderExists = groupedFolders.some(f => f.key === selectedFolder);
      if (!folderExists) {
        setSelectedFolder(null);
        setPage(1);
      }
    }
  }, [selectedFolder, groupedFolders]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    if (value) {
      // When searching, we keep the status filter empty to search across all flights
      setStatusFilter('');
      setSelectedFolder(null);
    } else {
      setStatusFilter('PENDING');
    }
  };

  const handleStatusCardClick = (status: string) => {
    if (statusFilter === status && !searchTerm) {
      // If clicking already active card, maybe reset? 
      // User said "corrigir contagem ao clicar", usually clicking should just filter.
      setStatusFilter(status);
    } else {
      setStatusFilter(status);
      setSearchTerm('');
      setSelectedFolder(null);
    }
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setStatusFilter('PENDING');
    setSelectedFolder(null);
    setPage(1);
  };

  // Pagination for the CURRENT view (Folders or Flights)
  const paginatedData = useMemo(() => {
    if (selectedFolder) return [];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // If searching, we show all results. If not, filtered by status.
    // Note: Search ignores period filters for visibility
    const baseFlights = searchTerm
      ? flights
      : (statusFilter ? flightsInPeriod.filter(f => f.status === statusFilter) : flightsInPeriod);

    return baseFlights.slice(startIndex, endIndex);
  }, [flights, flightsInPeriod, page, selectedFolder, statusFilter, searchTerm]);

  const flightDataInFolder = useMemo(() => {
    if (!selectedFolder) return [];
    const folder = groupedFolders.find(f => f.key === selectedFolder);
    return folder ? folder.flights : [];
  }, [groupedFolders, selectedFolder]);

  const paginatedFlights = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return flightDataInFolder.slice(startIndex, endIndex);
  }, [flightDataInFolder, page]);

  // Accurate Status Counts from flights IN PERIOD
  const statusCounts = useMemo(() => {
    return {
      PENDING: flightsInPeriod.filter(f => f.status === 'PENDING').length,
      SENT: flightsInPeriod.filter(f => f.status === 'SENT').length
    };
  }, [flightsInPeriod]);

  const columns: Column<Flight>[] = [
    {
      key: 'voo',
      header: 'Voo / Aeronave',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
            <Plane size={20} />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{item.flightCode}</div>
            <div className="text-xs text-slate-500">{item.aircraftName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'chegada',
      header: 'Chegada',
      render: (item) => (
        <div className="flex flex-col">
          <div className="font-medium text-slate-700">{formatDateBR(item.arrivalDate)}</div>
          <div className="text-[10px] text-slate-400 font-mono">{item.arrivalTime}</div>
        </div>
      ),
    },
    {
      key: 'cargas',
      header: 'Cargas',
      align: 'center',
      render: (item) => (
        <Badge variant="secondary" className="font-mono">
          {item._count?.cargoItems || 0}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const isSent = item.status === FlightStatus.SENT;
        return (
          <Badge
            variant="outline"
            className={isSent
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'}
          >
            {isSent ? 'ENVIADO' : 'EM OPERACAO'}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'Acoes',
      align: 'center',
      render: (item) => (
        <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <ActionButton
            onClick={() => setSelectedFlightId(item.id)}
            icon={<Eye size={16} />}
          >
            Detalhes
          </ActionButton>
          <ActionButton
            onClick={() => setEditingFlight(item)}
            icon={<Edit size={16} />}
            title="Editar"
          />
          <ActionButton
            onClick={() => setFlightToDelete(item)}
            icon={<Trash2 size={16} />}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
            title="Excluir"
          />
        </div>
      )
    }
  ];

  if (selectedFlightId) {
    return (
      <FlightDetail
        flightId={selectedFlightId}
        onBack={(newStatus) => {
          setSelectedFlightId(null);
          if (newStatus) {
            setStatusFilter(newStatus);
            setSearchTerm('');
            setPage(1);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Controle Aereo (CCTE)"
        description="Gestao de voos e cargas aereas."
        actions={
          <Button onClick={() => setIsNewFlightModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Voo
          </Button>
        }
      />

      <StatusCards
        cards={STATUS_CARDS}
        statusCounts={statusCounts}
        activeStatus={statusFilter}
        onStatusClick={handleStatusCardClick}
        columns={2}
      />

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full">
            <SearchBar
              placeholder="Buscar por voo, house, importador..."
              onSearch={handleSearch}
              onClear={handleClearSearch}
              showClearButton={!!(searchTerm || statusFilter)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[140px] bg-white border-slate-200">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {getMonthName(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[110px] bg-white border-slate-200">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedFolder ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedFolder(null); setPage(1); }}
                className="text-slate-500 hover:text-slate-900"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar para Pastas
              </Button>
              <div className="flex items-center gap-2 text-sm font-bold text-primary-500 uppercase tracking-widest px-2">
                <Folder className="w-4 h-4 text-primary-400" />
                <span>
                  {(() => {
                    const current = groupedFolders.find(f => f.key === selectedFolder);
                    return current ? `${getMonthName(current.month)} ${current.year}` : '';
                  })()}
                </span>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={paginatedFlights}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              isError={isError}
              errorMessage="Erro ao carregar voos."
              emptyMessage="Nenhum voo encontrado nesta pasta."
              onRowClick={(flight) => setEditingFlight(flight)}
              pagination={{
                page,
                total: flightDataInFolder.length,
                limit,
                onPageChange: setPage,
                onLimitChange: setLimit,
              }}
            />
          </div>
        ) : searchTerm ? (
          <DataTable
            columns={columns}
            data={paginatedData}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            isError={isError}
            errorMessage="Erro ao carregar voos."
            emptyMessage="Nenhum voo encontrado para sua busca."
            onRowClick={(flight) => setEditingFlight(flight)}
            pagination={{
              page,
              total: flights.length,
              limit,
              onPageChange: setPage,
              onLimitChange: setLimit,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
              ))
            ) : groupedFolders.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Folder className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Nenhuma pasta encontrada.</p>
              </div>
            ) : (
              groupedFolders.map((folder) => (
                <button
                  key={folder.key}
                  onClick={() => { setSelectedFolder(folder.key); setPage(1); }}
                  className="group relative bg-white border border-slate-200 p-6 rounded-2xl text-left shadow-sm hover:shadow-xl hover:border-primary-400 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <Folder className="w-10 h-10 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />

                  <div>
                    <h4 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-primary-600 transition-colors">
                      {getMonthName(folder.month)}
                    </h4>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{folder.year}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                      {folder.flights.length} {folder.flights.length === 1 ? 'Voo' : 'Voos'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <NewFlightModal
        open={isNewFlightModalOpen}
        onOpenChange={setIsNewFlightModalOpen}
      />

      {editingFlight && (
        <EditFlightModal
          flight={editingFlight}
          open={!!editingFlight}
          onOpenChange={(open) => !open && setEditingFlight(null)}
        />
      )}

      <ConfirmDialog
        open={!!flightToDelete}
        onOpenChange={(open) => !open && setFlightToDelete(null)}
        title="Excluir Voo"
        description={`Deseja realmente excluir o voo ${flightToDelete?.flightCode}? Esta ação removerá também todas as cargas vinculadas.`}
        confirmText="Excluir"
        variant="destructive"
        onConfirm={async () => {
          if (flightToDelete) {
            await deleteFlightMutation.mutateAsync(flightToDelete.id);
            setFlightToDelete(null);
          }
        }}
        isLoading={deleteFlightMutation.isPending}
      />
    </div>
  );
}

