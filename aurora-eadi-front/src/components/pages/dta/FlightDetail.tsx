'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useAuthContext } from '@/context/AuthContext';
import { WarehouseReason } from '@/types/ccte';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Edit,
  Send,
  RotateCcw,
  Check,
  X,
  FileText,
  User,
  Box,
  Plane,
  Clock,
  Calendar,
  Download,
} from 'lucide-react';
import {
  useFlight,
  useUpdateCargoItem,
  useMarkFlightSent,
  useSendCargoItem,
} from '@/hooks/useCcte';
import { formatDateBR } from '@/lib/date-format-utils';
import {
  FlightStatus,
  CargoItem,
  CargoItemStatus,
} from '@/types/ccte';
import { NewItemModal } from './modals/NewItemModal';
import { EditItemModal } from './modals/EditItemModal';
import { EditFlightModal } from './modals/EditFlightModal';
import { RevertFlightModal } from './modals/RevertFlightModal';
import { RfbExportModal } from './modals/RfbExportModal';
import { FlightHistoryPanel } from './FlightHistoryPanel';
import {
  DataTable,
  Column,
  SearchBar,
} from '@/components/ui/DataTable';

interface FlightDetailProps {
  flightId: string;
  onBack: (newStatus?: string) => void;
}

export function FlightDetail({ flightId, onBack }: FlightDetailProps) {
  const { data: flight, isLoading, isError } = useFlight(flightId);

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditFlightModalOpen, setIsEditFlightModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isRfbModalOpen, setIsRfbModalOpen] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<CargoItem | null>(
    null,
  );

  // Inline edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempDta, setTempDta] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const updateCargoItemMutation = useUpdateCargoItem();
  const markFlightSentMutation = useMarkFlightSent();
  const sendCargoItemMutation = useSendCargoItem();

  const items = flight?.cargoItems || [];
  const history = flight?.history || [];
  const isSent = flight?.status === FlightStatus.SENT;

  const sentItems = useMemo(() => items.filter((item) => item.sent === true), [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toUpperCase();
    return items.filter(
      (item) =>
        item.house.toUpperCase().includes(term) ||
        item.importer.toUpperCase().includes(term),
    );
  }, [items, searchTerm]);

  // Client-side pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, page]);

  const dtaFilledCount = items.filter(
    (item) => item.dta && item.dta.trim() !== '',
  ).length;

  const allDtaFilled = items.length > 0 && dtaFilledCount === items.length;

  const canMarkSent =
    !isSent && items.length > 0 && allDtaFilled;

  const handleStartEditDta = (
    e: React.MouseEvent,
    item: CargoItem,
  ) => {
    e.stopPropagation();
    if (isSent || item.sent) return;
    setEditingItemId(item.id);
    setTempDta(item.dta || '');
  };

  const handleSaveDta = async (itemId: string) => {
    const trimmedDta = tempDta.trim();
    await updateCargoItemMutation.mutateAsync({
      id: itemId,
      data: { dta: trimmedDta },
      flightId: flightId,
    });
    setEditingItemId(null);
    setTempDta('');
  };

  const handleCancelDta = () => {
    setEditingItemId(null);
    setTempDta('');
  };

  const handleClearDta = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    await updateCargoItemMutation.mutateAsync({
      id: itemId,
      data: { dta: '' },
      flightId: flightId,
    });
  };

  const handleToggleRemoval = async (e: React.ChangeEvent<HTMLInputElement>, item: CargoItem) => {
    const isChecked = e.target.checked;

    if (isChecked) {
      await sendCargoItemMutation.mutateAsync({ id: item.id, flightId: flightId });
    } else {
      await updateCargoItemMutation.mutateAsync({
        id: item.id,
        data: { sent: false, status: CargoItemStatus.DTA_REGISTRADA },
        flightId: flightId,
      });
    }
  };

  const handleMarkFlightSent = async () => {
    if (!flight) return;
    await markFlightSentMutation.mutateAsync(flight.id);
    onBack('SENT');
  };

  const applyDtaMask = (value: string) => {
    let clean = value.replace(/\D/g, '');
    if (clean.length > 10) clean = clean.slice(0, 10);

    let masked = clean;
    if (clean.length > 2) {
      masked = clean.slice(0, 2) + '/' + clean.slice(2);
    }
    if (clean.length > 9) {
      masked = masked.slice(0, 10) + '-' + masked.slice(10);
    }
    return masked;
  };

  const columns: Column<CargoItem>[] = [
    {
      key: 'dta',
      header: 'DTA',
      render: (item) => {
        if (editingItemId === item.id) {
          return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={tempDta}
                onChange={(e) => setTempDta(applyDtaMask(e.target.value))}
                className="h-8 text-xs w-28"
                autoFocus
                placeholder="00/0000000-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDta(item.id);
                  if (e.key === 'Escape') handleCancelDta();
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600"
                onClick={() => handleSaveDta(item.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                onClick={handleCancelDta}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }

        const isDtaFilled = item.dta && item.dta.trim() !== '';

        return (
          <div className="flex items-center gap-1">
            <div
              onClick={(e) => handleStartEditDta(e, item)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border border-dashed cursor-pointer inline-flex items-center gap-2 transition-all ${isSent || item.sent
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : isDtaFilled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
                }`}
            >
              {isDtaFilled ? applyDtaMask(item.dta) : 'PENDENTE'}
              {!(isSent || item.sent) && <Edit size={10} className="opacity-50" />}
            </div>
            {isDtaFilled && !(isSent || item.sent) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:bg-red-50"
                onClick={(e) => handleClearDta(e, item.id)}
                title="Limpar DTA"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      }
    },
    {
      key: 'house',
      header: 'House',
      render: (item) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-slate-400" />
          <span className="font-medium text-slate-700">{item.house}</span>
        </div>
      )
    },
    {
      key: 'importer',
      header: 'Importador',
      render: (item) => (
        <div className="flex items-center gap-2 text-slate-600">
          <User size={14} className="text-slate-400" />
          {item.importer}
        </div>
      )
    },
    {
      key: 'tc',
      header: 'TC',
      align: 'center',
      render: (item) => {
        // If TC is A and has warehouse reason, show the reason abbreviation with tooltip
        if (item.tc === 'A' && item.warehouseReason) {
          const reasonLabels: Record<WarehouseReason, string> = {
            [WarehouseReason.CV]: 'Canal Vermelho',
            [WarehouseReason.MA]: 'Ministério da Agricultura',
            [WarehouseReason.RF]: 'Receita Federal',
            [WarehouseReason.DOC]: 'Documento Pendente',
            [WarehouseReason.DIV]: 'Diversos',
            [WarehouseReason.MT]: 'Mudança de Tratamento',
            [WarehouseReason.P]: 'Removida no Prazo Pátio',
          };

          return (
          <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-mono font-semibold text-amber-700 cursor-help">
                    {item.warehouseReason}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{reasonLabels[item.warehouseReason]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        // TC = P with tooltip
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono font-bold text-slate-700 cursor-help">{item.tc}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Removida no Prazo Pátio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        let variant: "default" | "secondary" | "outline" = "secondary";
        let className = "";

        switch (item.status) {
          case CargoItemStatus.EM_ANALISE:
            variant = "outline";
            className = "text-amber-700 border-amber-200 bg-amber-50";
            break;
          case CargoItemStatus.DTA_REGISTRADA:
            variant = "outline";
            className = "text-blue-700 border-blue-200 bg-blue-50";
            break;
          case CargoItemStatus.ENVIADO:
            variant = "outline";
            className = "text-emerald-700 border-emerald-200 bg-emerald-50";
            break;
        }

        return <Badge variant={variant} className={className}>{item.status.replace('_', ' ')}</Badge>;
      }
    },
    {
      key: 'obs',
      header: 'Observacoes',
      render: (item) => (
        <span className="text-xs text-slate-500 italic max-w-[200px] truncate block">
          {item.observations || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Enviados',
      align: 'center',
      render: (item) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={!!item.sent}
            disabled={isSent || sendCargoItemMutation.isPending || updateCargoItemMutation.isPending || (!item.sent && (!item.dta || item.dta.trim() === ''))}
            onChange={(e) => handleToggleRemoval(e, item)}
            className="w-5 h-5 rounded border-slate-300 accent-primary-600 cursor-pointer disabled:cursor-not-allowed transition-all"
            title={!item.dta || item.dta.trim() === '' ? "Preencha a DTA primeiro" : item.sent ? "Desfazer Remoção" : "Informar Remoção"}
          />
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Voo nao encontrado</p>
      </div>
    );
  }

  const arrivalDateFormatted = formatDateBR(flight.arrivalDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Hero Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">

          <div className="flex items-start gap-4">
            <div className="mt-1">
              <Button variant="ghost" size="icon" onClick={() => onBack()} className="shrink-0 h-10 w-10 text-slate-400 hover:text-slate-700">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="hidden md:flex h-16 w-16 bg-primary-50 rounded-2xl items-center justify-center border border-primary-100 shadow-sm">
                <Plane className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{flight.flightCode}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Plane size={14} className="text-slate-400" />
                    <p>Companhia:</p>{flight.aircraftName}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <FileText size={14} className="text-slate-400" />
                    <p>Termo:</p>{flight.termoEntrada}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Calendar size={14} className="text-slate-400" />
                    {arrivalDateFormatted}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Clock size={14} className="text-slate-400" />
                    {flight.arrivalTime}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <Badge
              className={`px-3 py-1 text-sm font-semibold shadow-sm ${isSent
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
                }`}
            >
              {isSent ? 'ENVIADO' : 'PENDENTE'}
            </Badge>

            <div className="flex items-center gap-2 mt-2">
              {!isSent ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditFlightModalOpen(true)}
                    className="hover:bg-slate-50 text-slate-600 border-slate-300 shadow-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cargas
                  </Button>
                  {canMarkSent && (
                    <Button
                      size="sm"
                      onClick={handleMarkFlightSent}
                      disabled={markFlightSentMutation.isPending}
                      className="animate-pulse bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <Plane className="h-4 w-4 mr-2" />
                      Vôo Finalizado
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsRevertModalOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reverter status para Pendente
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Total de Itens</p>
            <p className="text-2xl font-bold text-slate-800">{items.length}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <Box size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">DTA Preenchidos</p>
            <p className="text-2xl font-bold text-slate-800">{dtaFilledCount} <span className="text-sm text-slate-400 font-normal">/ {items.length}</span></p>
          </div>
          <div className={`p-3 rounded-lg ${allDtaFilled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            <FileText size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Prev. Chegada</p>
            <p className="text-2xl font-bold text-slate-800">{flight.arrivalTime}</p>
          </div>
          <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
            <Clock size={20} />
          </div>
        </div>
      </div>

      <FlightHistoryPanel history={history} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Cargas</h3>
          <div className="flex items-center gap-2">
            {sentItems.length > 0 && (
              <Button
                onClick={() => setIsRfbModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-5 py-2 text-sm font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                RFB ({sentItems.length})
              </Button>
            )}
            <div className="w-72">
              <SearchBar
                placeholder="Buscar Carga..."
                onSearch={(v) => { setSearchTerm(v); setPage(1); }}
                onClear={() => { setSearchTerm(''); setPage(1); }}
                showClearButton={!!searchTerm}
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paginatedItems}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhuma carga registrada."
          onRowClick={(item) => !isSent && setSelectedEditItem(item)}
          rowClassName={(item) => !isSent && !item.sent ? 'cursor-pointer' : ''}
          pagination={{
            page,
            total: filteredItems.length,
            limit,
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />
      </div>

      <NewItemModal
        open={isAddItemModalOpen}
        onOpenChange={setIsAddItemModalOpen}
        flightId={flightId}
      />

      {!isSent && (

        <EditItemModal
          open={!!selectedEditItem}
          onOpenChange={(open) => {
            if (!open) setSelectedEditItem(null);
          }}
          item={selectedEditItem}
        />
      )}

      <EditFlightModal
        open={isEditFlightModalOpen}
        onOpenChange={setIsEditFlightModalOpen}
        flight={flight}
        onDeleted={onBack}
      />

      <RevertFlightModal
        open={isRevertModalOpen}
        onOpenChange={setIsRevertModalOpen}
        flightId={flight.id}
      />

      <RfbExportModal
        open={isRfbModalOpen}
        onOpenChange={setIsRfbModalOpen}
        sentItems={sentItems}
      />
    </div>
  );
}
