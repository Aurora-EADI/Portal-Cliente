'use client';

import React, { useState } from 'react';
import { CalendarDays, FileText, CheckCircle, XCircle, Clock, Eye, MapPin, Phone, User, Briefcase, CreditCard, RefreshCw } from 'lucide-react';
import { useAgenda, useAgendaSummary, useUpdateVisitanteStatus } from '@/hooks/useAgenda';
import { AgendaFilters, PreRegistroVisitante, VisitanteStatus } from '@/types/visitantes';
import { gerarDeclaracaoVisitante } from '@/lib/declaracaoVisitante';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<
  VisitanteStatus,
  { label: string; icon: React.ReactNode }
> = {
  [VisitanteStatus.AGENDADO]: {
    label: 'Agendado',
    icon: <Clock size={12} />,
  },
  [VisitanteStatus.PRESENTE]: {
    label: 'Presente',
    icon: <CheckCircle size={12} />,
  },
  [VisitanteStatus.NAO_COMPARECEU]: {
    label: 'Não Compareceu',
    icon: <XCircle size={12} />,
  },
};

function StatusBadge({ status }: { status: VisitanteStatus }) {
  const cfg = STATUS_CONFIG[status];
  const colorClass =
    status === VisitanteStatus.AGENDADO
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : status === VisitanteStatus.PRESENTE
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function formatHorario(value?: string) {
  if (!value) return '—';

  const date = new Date(value);

  // Ajusta para UTC-4 (Manaus)
  const offset = -4 * 60; // em minutos
  const local = new Date(date.getTime() + offset * 60 * 1000);

  const hours = local.getUTCHours().toString().padStart(2, '0');
  const minutes = local.getUTCMinutes().toString().padStart(2, '0');
  const day = local.getUTCDate().toString().padStart(2, '0');
  const month = (local.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = local.getUTCFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatTelefone(tel?: string | null) {
  if (!tel) return '—';
  const digits = tel.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return tel;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
    </div>
  );
}

function VisitanteModal({
  visitante,
  onClose,
  onEmitirPdf,
}: {
  visitante: PreRegistroVisitante;
  onClose: () => void;
  onEmitirPdf: (v: PreRegistroVisitante) => void;
}) {
  const endereco = [
    visitante.endereco,
    visitante.numero,
    visitante.bairro,
    visitante.cidade,
    visitante.estado,
    visitante.cep,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <User size={18} className="text-orange-600" />
            Detalhes do Visitante
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <StatusBadge status={visitante.status} />
            <span className="text-xs text-gray-400">
              {formatHorario(visitante.horarioPrevisto)}
            </span>
          </div>

          {/* Identificação */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CreditCard size={12} /> Identificação
            </p>
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
              <DetailRow label="Nome" value={visitante.nome} />
              <DetailRow label="Função" value={visitante.funcao} />
              <DetailRow label="CPF" value={formatCpf(visitante.cpf)} />
              <DetailRow label="RG" value={visitante.rg} />
            </div>
          </div>

          {/* Contato */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Phone size={12} /> Contato
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <DetailRow label="Telefone" value={formatTelefone(visitante.telefone)} />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <MapPin size={12} /> Endereço
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <DetailRow label="Endereço completo" value={endereco || undefined} />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Briefcase size={12} /> Motivo da Visita
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-800">{visitante.motivo || '—'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-4">
          <Button variant="outline" onClick={onClose} className="h-9">
            Fechar
          </Button>
          <Button
            onClick={() => onEmitirPdf(visitante)}
            className="h-9 bg-orange-600 hover:bg-orange-700 text-white gap-2"
          >
            <FileText size={14} />
            Emitir Declaração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AgendaPage() {
  const [filters, setFilters] = useState<AgendaFilters>({
    page: 1,
    limit: 10,
    dataInicio: getTodayStr(),
    dataFim: getTomorrowStr(),
  });
  const [nomeInput, setNomeInput] = useState('');
  const [dataInicioInput, setDataInicioInput] = useState(getTodayStr());
  const [dataFimInput, setDataFimInput] = useState(getTomorrowStr());
  const [statusInput, setStatusInput] = useState<VisitanteStatus | ''>('');
  const [selectedVisitante, setSelectedVisitante] = useState<PreRegistroVisitante | null>(null);

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useAgenda(filters);
  const { data: summary } = useAgendaSummary(filters.dataInicio, filters.dataFim);
  const { mutate: updateStatus } = useUpdateVisitanteStatus();

  const applyFilters = () => {
    setFilters({
      nome: nomeInput || undefined,
      dataInicio: dataInicioInput || undefined,
      dataFim: dataFimInput || undefined,
      status: statusInput || undefined,
      page: 1,
      limit: filters.limit,
    });
  };

  const clearFilters = () => {
    setNomeInput('');
    setDataInicioInput(getTodayStr());
    setDataFimInput(getTomorrowStr());
    setStatusInput('');
    setFilters({
      page: 1,
      limit: 10,
      dataInicio: getTodayStr(),
      dataFim: getTomorrowStr(),
    });
  };

  const handleStatusUpdate = (visitante: PreRegistroVisitante, status: VisitanteStatus) => {
    updateStatus({ id: visitante.id, status });
  };

  const handleEmitirPdf = async (visitante: PreRegistroVisitante) => {
    try {
      await gerarDeclaracaoVisitante(visitante);
    } catch {
      toast.error('Erro ao gerar PDF.');
    }
  };

  const visitantes = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto pb-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <CalendarDays className="text-orange-600" size={28} />
              Agenda de Visitantes
            </h1>
            <p className="text-gray-500 mt-1">
              Gerencie os visitantes agendados e registre presenças
            </p>
          </div>
          <div className="flex items-center gap-3">
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-gray-400">
                Atualizado às{' '}
                {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 gap-2 text-gray-600"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Atualizar
            </Button>
          </div>
        </header>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nome</label>
              <Input
                placeholder="Buscar por nome..."
                value={nomeInput}
                onChange={(e) => setNomeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition"
              />
            </div>

            <div className="w-[160px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Data Início</label>
              <Input
                type="date"
                value={dataInicioInput}
                onChange={(e) => setDataInicioInput(e.target.value)}
                className="border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition"
              />
            </div>

            <div className="w-[160px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={dataFimInput}
                onChange={(e) => setDataFimInput(e.target.value)}
                className="border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition"
              />
            </div>

            <div className="w-[180px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as VisitanteStatus | '')}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              >
                <option value="">Todos</option>
                <option value={VisitanteStatus.AGENDADO}>Agendado</option>
                <option value={VisitanteStatus.PRESENTE}>Presente</option>
                <option value={VisitanteStatus.NAO_COMPARECEU}>Não Compareceu</option>
              </select>
            </div>

            <Button
              onClick={applyFilters}
              className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-4"
            >
              Filtrar
            </Button>
            <Button variant="outline" onClick={clearFilters} className="h-9 px-4">
              Limpar
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-blue-100">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agendado</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.agendado ?? '—'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5 flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-green-100">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Presente</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.presente ?? '—'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5 flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-red-100">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Não Compareceu</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.naoCompareceu ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mb-4" />
            <p className="text-gray-500 font-medium">Carregando visitantes...</p>
          </div>
        ) : visitantes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CalendarDays size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum visitante encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">Motivo</TableHead>
                    <TableHead className="font-semibold text-gray-700">Horário Previsto</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitantes.map((v) => (
                    <TableRow key={v.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-900">{v.nome}</TableCell>
                      <TableCell className="text-gray-600 max-w-[220px] truncate">
                        {v.motivo || '—'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatHorario(v.horarioPrevisto)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={v.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Atualizar status — só aparece se AGENDADO */}
                          {v.status === VisitanteStatus.AGENDADO && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 text-xs">
                                  Atualizar Status
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(v, VisitanteStatus.PRESENTE)}
                                  className="text-green-700 focus:text-green-700 focus:bg-green-50"
                                >
                                  <CheckCircle size={14} className="mr-2" />
                                  Presente
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(v, VisitanteStatus.NAO_COMPARECEU)
                                  }
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <XCircle size={14} className="mr-2" />
                                  Não Compareceu
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* Ver detalhes */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1 text-gray-600 hover:text-orange-600"
                            onClick={() => setSelectedVisitante(v)}
                          >
                            <Eye size={14} />
                            Detalhes
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination
              page={filters.page ?? 1}
              total={total}
              limit={filters.limit ?? 10}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              onLimitChange={(l) => setFilters((f) => ({ ...f, limit: l, page: 1 }))}
            />
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {selectedVisitante && (
        <VisitanteModal
          visitante={selectedVisitante}
          onClose={() => setSelectedVisitante(null)}
          onEmitirPdf={handleEmitirPdf}
        />
      )}
    </div>
  );
}
