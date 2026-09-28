'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { DI, Motorista, Veiculo, Transportadora, Agendamento, AgendamentoStatus, JanelaAtendimento } from '@/types/agendamento';
import { DadosFormData } from '@/components/pages/agendamento/steps/DadosStep';
import { NotificacoesFormData } from '@/components/pages/agendamento/steps/NotificacoesStep';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { api } from '@/lib/api';
import { useAgendamentoWizard } from '@/store/agendamento-wizard.store';
import { useDisAverbadasStream, type DiAverbadaStreamEvent } from '@/hooks/useDisAverbadasStream';
import { useAgendamentoStream } from '@/hooks/useAgendamentoStream';
import { getStatusLabel } from '@/lib/agendamento-status';

interface AgendamentoContextValue {
  isLoadingData: boolean;
  dis: DI[];
  motoristas: Motorista[];
  veiculos: Veiculo[];
  transportadoras: Transportadora[];
  transportadorasConta: Transportadora[];
  activeBookings: Agendamento[];
  visibleDis: DI[];
  visibleBookings: Agendamento[];
  isAdmin: boolean;
  isDespachante: boolean;
  isTransportadora: boolean;
  canSelectClient: boolean;
  janelasAtendimento: JanelaAtendimento[];
  selectedClient: string;
  selectedJanelaId: string;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  selectedDI: DI | null;
  setSelectedDI: (di: DI | null) => void;
  selectedMotorista: Motorista | null;
  setSelectedMotorista: (m: Motorista | null) => void;
  selectedVeiculo: Veiculo | null;
  setSelectedVeiculo: (v: Veiculo | null) => void;
  successBooking: Agendamento | null;
  setSuccessBooking: (b: Agendamento | null) => void;
  viewingArchiveBooking: Agendamento | null;
  setViewingArchiveBooking: (b: Agendamento | null) => void;
  setSelectedClient: (c: string) => void;
  saveJanelasToStorage: (list: JanelaAtendimento[]) => void;
  createJanelaApi: (data: Omit<JanelaAtendimento, 'id'>) => Promise<JanelaAtendimento>;
  updateJanelaApi: (id: string, data: Partial<JanelaAtendimento>) => Promise<JanelaAtendimento>;
  deleteJanelaApi: (id: string) => Promise<void>;
  saveSelectedJanelaIdToStorage: (id: string) => void;
  handleAddMotorista: (m: Motorista) => Promise<Motorista>;
  handleAddVeiculo: (v: Veiculo) => Promise<Veiculo>;
  handleEditMotorista: (id: string, data: Partial<Pick<Motorista, 'nome' | 'cnh' | 'telefone'>>) => Promise<void>;
  handleEditVeiculo: (id: string, data: Partial<Pick<Veiculo, 'modelo' | 'tipo'>>) => Promise<void>;
  handleCancelBooking: (id: string) => void;
  handleConfirmBooking: (data: string, horario: string) => Promise<void>;
  handleSaveNovoAgendamento: (dados: DadosFormData, notificacoes: NotificacoesFormData) => Promise<Agendamento>;
  handleResetWizard: () => void;
}

const AgendamentoContext = createContext<AgendamentoContextValue | undefined>(undefined);

const VALID_STATUSES = ['ATIVO','CANCELADO','CHEGOU','NO_SHOW','ON_TIME','ATRASADO','AG_CHEGADA','CONCLUIDO'] as const satisfies readonly AgendamentoStatus[];

/** O que o SSE de agendamento entrega. Minimo de proposito: ver agendamento.eventos.ts. */
type AgendamentoStatusEvent = {
  id?: string;
  status?: string;
  previousStatus?: string | null;
  aggregateVersion?: number;
  criado?: boolean;
};

type ApiRelation = string | { nome?: string | null } | null | undefined;
type ApiBooking = {
  id?: string;
  status?: string;
  aggregateVersion?: number;
  diId?: string | null;
  diNumero?: string | null;
  di?: { numeroDI?: string | null; container?: string | null; cliente?: ApiRelation } | null;
  cliente?: ApiRelation;
  empresa?: string | null;
  diCliente?: string | null;
  container?: string | null;
  motorista?: Motorista;
  veiculo?: Veiculo;
  nomeMotorista?: string;
  cpfMotorista?: string;
  placaVeiculo?: string;
  tipoVeiculo?: string;
  data?: string;
  horario?: string;
  protocolo?: string;
  observacao?: string | null;
  criadoEm?: string;
  operacao?: string | null;
  subOperacao?: string | null;
  cargaEspecial?: boolean | null;
  servicos?: string[] | null;
  awbMawb?: string | string[] | null;
  dta?: string | string[] | null;
  hawb?: string | string[] | null;
  numeroVoo?: string | null;
  volumes?: string | null;
  peso?: string | null;
  consignatario?: string | null;
  transportadora?: string | null;
  criadoPorNome?: string | null;
  criadoPorRole?: string | null;
  cnpjCliente?: string | null;
  enderecoCliente?: string | null;
  telefoneCliente?: string | null;
  emailCliente?: string | null;
  cnpjTransportadora?: string | null;
  enderecoTransportadora?: string | null;
  telefoneTransportadora?: string | null;
  emailTransportadora?: string | null;
};

type ApiDI = Omit<DI, 'cliente'> & { cliente?: ApiRelation };

function relationName(value: ApiRelation): string | undefined {
  if (typeof value === 'string') return value;
  return value?.nome ?? undefined;
}

function mapApiBooking(b: ApiBooking): Agendamento {
  const status = VALID_STATUSES.find(value => value === b.status) ?? 'ATIVO';
  return {
    id: b.id ?? '',
    diId: b.diId ?? '',
    diNumero: b.di?.numeroDI ?? b.diNumero ?? '',
    diCliente: relationName(b.di?.cliente) ?? relationName(b.cliente) ?? b.empresa ?? b.diCliente ?? '',
    container: b.di?.container ?? b.container ?? '',
    motorista: b.motorista ?? { id: '', nome: b.nomeMotorista ?? '', cpf: b.cpfMotorista ?? '', cnh: '', telefone: '' },
    veiculo: b.veiculo ?? { id: '', placa: b.placaVeiculo ?? '', modelo: b.tipoVeiculo ?? '', tipo: b.tipoVeiculo ?? '' },
    data: b.data ?? '',
    horario: b.horario ?? '',
    protocolo: b.protocolo ?? '',
    status,
    aggregateVersion: b.aggregateVersion,
    observacao: b.observacao ?? undefined,
    criadoEm: b.criadoEm ?? '',
    operacao: b.operacao ?? undefined,
    subOperacao: b.subOperacao ?? undefined,
    cargaEspecial: b.cargaEspecial ?? undefined,
    servicos: b.servicos ?? undefined,
    empresa: b.empresa ?? undefined,
    awbMawb: b.awbMawb ?? undefined,
    dta: b.dta ?? undefined,
    hawb: b.hawb ?? undefined,
    numeroVoo: b.numeroVoo ?? undefined,
    volumes: b.volumes ?? undefined,
    peso: b.peso ?? undefined,
    consignatario: b.consignatario ?? undefined,
    transportadora: b.transportadora ?? undefined,
    criadoPorNome: b.criadoPorNome ?? undefined,
    criadoPorRole: b.criadoPorRole ?? undefined,
    cnpjCliente: b.cnpjCliente ?? undefined,
    enderecoCliente: b.enderecoCliente ?? undefined,
    telefoneCliente: b.telefoneCliente ?? undefined,
    emailCliente: b.emailCliente ?? undefined,
    cnpjTransportadora: b.cnpjTransportadora ?? undefined,
    enderecoTransportadora: b.enderecoTransportadora ?? undefined,
    telefoneTransportadora: b.telefoneTransportadora ?? undefined,
    emailTransportadora: b.emailTransportadora ?? undefined,
  };
}

export function AgendamentoProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuthContext();
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.EMPLOYEE;
  const isDespachante = currentUser?.role === UserRole.DESPACHANTE;
  const isTransportadora = currentUser?.role === UserRole.TRANSPORTADORA;
  const canSelectClient = isAdmin || isDespachante;
  const userClienteNome = currentUser?.cliente?.nome ?? null;
  const clienteId = (!canSelectClient && currentUser?.cliente?.id) ? currentUser.cliente.id : undefined;

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dis, setDis] = useState<DI[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [transportadorasConta, setTransportadorasConta] = useState<Transportadora[]>([]);
  const [activeBookings, setActiveBookings] = useState<Agendamento[]>([]);
  const [janelasAtendimento, setJanelasAtendimento] = useState<JanelaAtendimento[]>([]);

  const {
    currentStep, setCurrentStep,
    selectedDI, setSelectedDI,
    selectedMotorista, setSelectedMotorista,
    selectedVeiculo, setSelectedVeiculo,
    selectedJanelaId, setSelectedJanelaId,
    selectedClient: storedClient, setSelectedClient: storeSetClient,
    successBooking, setSuccessBooking,
    viewingArchiveBooking, setViewingArchiveBooking,
    resetWizard,
  } = useAgendamentoWizard();

  const selectedClient = canSelectClient
    ? (storedClient || '')
    : (userClienteNome ?? storedClient ?? '');

  useEffect(() => {
    setIsLoadingData(true);
    const params = clienteId ? { clienteId } : {};
    Promise.all([
      api.get('/agendamento/janelas').then(r => setJanelasAtendimento(r.data)).catch(() => {}),
      api.get('/agendamento/dis', { params }).then(r => setDis(r.data.map((d: ApiDI) => ({ ...d, cliente: relationName(d.cliente) ?? '' })))).catch(() => {}),
      api.get('/agendamento/motoristas', { params }).then(r => setMotoristas(r.data)).catch(() => {}),
      api.get('/agendamento/veiculos', { params }).then(r => setVeiculos(r.data)).catch(() => {}),
      api.get('/agendamento/transportadoras', { params }).then(r => setTransportadoras(r.data)).catch(() => {}),
      currentUser && [UserRole.CLIENTE, UserRole.DESPACHANTE, UserRole.TRANSPORTADORA].includes(currentUser.role)
        ? api.get('/agendamento/transportadoras-conta').then(r => setTransportadorasConta(r.data)).catch(() => {})
        : Promise.resolve(setTransportadorasConta([])),
      api.get('/agendamento/agendamentos', { params }).then(r => setActiveBookings(r.data.map(mapApiBooking))).catch(() => {}),
    ]).finally(() => setIsLoadingData(false));
  }, [clienteId, currentUser]);

  const onDiAverbadaEvent = (evento: DiAverbadaStreamEvent) => {
    if ('removida' in evento) {
      // DI desaverbada no Aurora: sai do dashboard.
      setDis(prev => prev.filter(d => d.nLote !== evento.nLote));
      toast.info(`DI desaverbada removida do painel`);
      return;
    }
    const di = evento;
    setDis(prev => {
      const exists = prev.some(d => d.nLote && d.nLote === di.nLote);
      if (exists) return prev.map(d => (d.nLote === di.nLote ? { ...d, ...di } : d));
      return [di, ...prev];
    });
    toast.info(`DI averbada: ${di.numeroDI}`);
  };

  useDisAverbadasStream(!!currentUser, onDiAverbadaEvent);

  const upsertBooking = (mapped: Agendamento) => {
    setActiveBookings(prev => {
      const exists = prev.some(b => b.id === mapped.id);
      return exists ? prev.map(b => (b.id === mapped.id ? mapped : b)) : [mapped, ...prev];
    });
  };

  /**
   * O stream manda o mínimo — id, status e versão — e não o agendamento inteiro:
   * o relê do backend não inclui a DI, e substituir a linha zeraria DI e
   * container a cada troca de status. Por isso aqui é merge, não replace.
   */
  const handleAgendamentoEvent = (payload: unknown) => {
    if (typeof payload !== 'object' || payload === null) return;
    const event = payload as AgendamentoStatusEvent;
    if (!event.id) return;

    // Agendamento que acabou de nascer: os quatro campos do evento não montam uma
    // linha, então busca-se o resto.
    if (event.criado) {
      const params = clienteId ? { clienteId } : {};
      api.get('/agendamento/agendamentos', { params })
        .then(r => setActiveBookings(r.data.map(mapApiBooking)))
        .catch(() => {});
      return;
    }

    const status = VALID_STATUSES.find(value => value === event.status);
    if (!status) return;

    // Decide sobre o estado desta renderização, e não dentro do updater: o
    // `useAgendamentoStream` guarda sempre o handler mais recente, então
    // `activeBookings` aqui está atual — e o updater só rodaria depois do retorno,
    // tarde demais para saber se houve mudança.
    const atual = activeBookings.find(b => b.id === event.id);
    // Sem a linha em mão não há o que mesclar: não é do escopo desta tela, ou ainda
    // não carregou. A próxima carga resolve.
    if (!atual) return;
    // Evento atrasado não faz o status voltar atrás.
    if (
      typeof event.aggregateVersion === 'number'
      && typeof atual.aggregateVersion === 'number'
      && event.aggregateVersion <= atual.aggregateVersion
    ) {
      return;
    }
    if (atual.status === status) return;

    setActiveBookings(prev => prev.map(b => (
      b.id === event.id
        ? { ...b, status, aggregateVersion: event.aggregateVersion ?? b.aggregateVersion }
        : b
    )));

    // A linha fica visível com o status novo até a próxima carga, inclusive quando
    // é cancelado ou no-show — aí a listagem já a devolve no histórico. Ver a
    // mudança acontecer é o ponto; desaparecer em silêncio não explica nada.
    toast.info(`Agendamento agora está ${getStatusLabel(status)}`);
  };

  useAgendamentoStream(!!currentUser, handleAgendamentoEvent);

  const saveJanelasToStorage = (list: JanelaAtendimento[]) => {
    setJanelasAtendimento(list);
  };

  const createJanelaApi = async (data: Omit<JanelaAtendimento, 'id'>) => {
    const { data: created } = await api.post('/agendamento/janelas', data);
    setJanelasAtendimento(prev => [...prev, created]);
    return created as JanelaAtendimento;
  };

  const updateJanelaApi = async (id: string, data: Partial<JanelaAtendimento>) => {
    const { data: updated } = await api.patch(`/agendamento/janelas/${id}`, data);
    setJanelasAtendimento(prev => prev.map(j => j.id === id ? { ...j, ...updated } : j));
    return updated as JanelaAtendimento;
  };

  const deleteJanelaApi = async (id: string) => {
    await api.delete(`/agendamento/janelas/${id}`);
    setJanelasAtendimento(prev => prev.filter(j => j.id !== id));
    if (selectedJanelaId === id) setSelectedJanelaId('all');
  };
  const saveSelectedJanelaIdToStorage = (id: string) => setSelectedJanelaId(id);
  const setSelectedClient = (c: string) => storeSetClient(c);

  // Sem fallback local: um cadastro que não chegou ao banco não pode aparecer
  // na lista como se tivesse sido salvo. O erro sobe para quem chamou.
  const handleAddMotorista = async (m: Motorista) => {
    const { data: saved } = await api.post('/agendamento/motoristas', {
      nome: m.nome, cpf: m.cpf, cnh: m.cnh, telefone: m.telefone,
    });
    const created: Motorista = { id: saved.id, nome: saved.nome, cpf: saved.cpf, cnh: saved.cnh, telefone: saved.telefone };
    setMotoristas(prev => [created, ...prev.filter(x => x.cpf.replace(/\D/g, '') !== created.cpf.replace(/\D/g, ''))]);
    return created;
  };

  const handleAddVeiculo = async (v: Veiculo) => {
    const { data: saved } = await api.post('/agendamento/veiculos', {
      placa: v.placa, modelo: v.modelo, tipo: v.tipo,
    });
    const created: Veiculo = { id: saved.id, placa: saved.placa, modelo: saved.modelo, tipo: saved.tipo };
    setVeiculos(prev => [created, ...prev.filter(x => x.placa.toUpperCase() !== created.placa.toUpperCase())]);
    return created;
  };

  const handleEditMotorista = async (id: string, data: Partial<Pick<Motorista, 'nome' | 'cnh' | 'telefone'>>) => {
    const { data: updated } = await api.patch(`/agendamento/motoristas/${id}`, data);
    setMotoristas(prev => prev.map(m => m.id === id ? { ...m, nome: updated.nome, cnh: updated.cnh, telefone: updated.telefone } : m));
  };

  const handleEditVeiculo = async (id: string, data: Partial<Pick<Veiculo, 'modelo' | 'tipo'>>) => {
    const { data: updated } = await api.patch(`/agendamento/veiculos/${id}`, data);
    setVeiculos(prev => prev.map(v => v.id === id ? { ...v, modelo: updated.modelo, tipo: updated.tipo } : v));
  };

  const handleCancelBooking = async (id: string) => {
    await api.patch(`/agendamento/agendamentos/${id}/cancelar`);
    setActiveBookings(prev => prev.filter(b => b.id !== id));
    if (successBooking?.id === id) { setSuccessBooking(null); setCurrentStep(1); }
    if (viewingArchiveBooking?.id === id) setViewingArchiveBooking(null);
  };

  const handleConfirmBooking = async (data: string, horario: string) => {
    if (!selectedDI || !selectedMotorista || !selectedVeiculo) return;
    const { data: booking } = await api.post('/agendamento/agendamentos', {
      diId: selectedDI.id,
      motoristaId: selectedMotorista.id,
      veiculoId: selectedVeiculo.id,
      data,
      horario,
    });
    const mapped = mapApiBooking(booking);
    upsertBooking(mapped);
    setSuccessBooking(mapped);
    setViewingArchiveBooking(null);
  };

  const handleSaveNovoAgendamento = async (dados: DadosFormData, notificacoes: NotificacoesFormData): Promise<Agendamento> => {
    const { data: created } = await api.post('/agendamento/agendamentos', {
      ...dados,
      notificarWhatsapp: notificacoes.notificarWhatsapp,
      whatsapp: notificacoes.whatsapp,
    });
    const mapped = mapApiBooking(created);
    upsertBooking(mapped);
    return mapped;
  };

  const handleResetWizard = () => resetWizard();

  const despachanteNome = currentUser?.despachante?.nome ?? null;
  const effectiveClient = isAdmin
    ? selectedClient
    : isDespachante
      ? (despachanteNome ?? selectedClient)
      : (userClienteNome ?? selectedClient);
  const visibleDis = isAdmin
    ? (selectedClient ? dis.filter(d => d.cliente === selectedClient) : dis)
    : dis;
  const visibleBookings = isAdmin
    ? (selectedClient ? activeBookings.filter(b => b.diCliente === selectedClient) : activeBookings)
    : activeBookings;

  return (
    <AgendamentoContext.Provider value={{
      isLoadingData, dis, motoristas, veiculos, transportadoras, transportadorasConta, activeBookings, janelasAtendimento,
      visibleDis, visibleBookings, isAdmin, isDespachante, isTransportadora, canSelectClient,
      selectedClient: effectiveClient, selectedJanelaId,
      currentStep, setCurrentStep, selectedDI, setSelectedDI,
      selectedMotorista, setSelectedMotorista, selectedVeiculo, setSelectedVeiculo,
      successBooking, setSuccessBooking, viewingArchiveBooking, setViewingArchiveBooking,
      setSelectedClient, saveJanelasToStorage, createJanelaApi, updateJanelaApi, deleteJanelaApi, saveSelectedJanelaIdToStorage,
      handleAddMotorista, handleAddVeiculo, handleEditMotorista, handleEditVeiculo,
      handleCancelBooking, handleConfirmBooking, handleSaveNovoAgendamento,
      handleResetWizard,
    }}>
      {children}
    </AgendamentoContext.Provider>
  );
}

export function useAgendamento(): AgendamentoContextValue {
  const ctx = useContext(AgendamentoContext);
  if (!ctx) throw new Error('useAgendamento must be used inside AgendamentoProvider');
  return ctx;
}
