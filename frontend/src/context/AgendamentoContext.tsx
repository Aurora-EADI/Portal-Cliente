'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { DI, Motorista, Veiculo, Transportadora, Agendamento, JanelaAtendimento } from '@/types/agendamento';
import { DadosFormData } from '@/components/pages/agendamento/steps/DadosStep';
import { NotificacoesFormData } from '@/components/pages/agendamento/steps/NotificacoesStep';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { api } from '@/lib/api';
import { useAgendamentoWizard } from '@/store/agendamento-wizard.store';
import { useDisAverbadasStream } from '@/hooks/useDisAverbadasStream';
import { useAgendamentoStream } from '@/hooks/useAgendamentoStream';

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
  handleAddMotorista: (m: Motorista) => void;
  handleAddVeiculo: (v: Veiculo) => void;
  handleEditMotorista: (id: string, data: Partial<Pick<Motorista, 'nome' | 'cnh' | 'telefone'>>) => Promise<void>;
  handleEditVeiculo: (id: string, data: Partial<Pick<Veiculo, 'modelo' | 'tipo'>>) => Promise<void>;
  handleCancelBooking: (id: string) => void;
  handleConfirmBooking: (data: string, horario: string) => Promise<void>;
  handleSaveNovoAgendamento: (dados: DadosFormData, notificacoes: NotificacoesFormData) => Promise<Agendamento>;
  handleResetWizard: () => void;
}

const AgendamentoContext = createContext<AgendamentoContextValue | undefined>(undefined);

const VALID_STATUSES = ['ATIVO','CANCELADO','CHEGOU','NO_SHOW','ON_TIME','ATRASADO','AG_CHEGADA','CONCLUIDO'] as const;
const ACTIVE_BOOKING_STATUSES = new Set(['ATIVO','AG_CHEGADA','CHEGOU','ON_TIME','ATRASADO']);

function mapApiBooking(b: any): Agendamento {
  const status = VALID_STATUSES.includes(b.status) ? b.status : 'ATIVO';
  return {
    id: b.id,
    diId: b.diId ?? '',
    diNumero: b.di?.numeroDI ?? b.diNumero ?? '',
    diCliente: b.di?.cliente?.nome ?? b.cliente?.nome ?? b.empresa ?? b.diCliente ?? '',
    container: b.di?.container ?? b.container ?? '',
    motorista: b.motorista ?? { id: '', nome: b.nomeMotorista ?? '', cpf: b.cpfMotorista ?? '', cnh: '', telefone: '' },
    veiculo: b.veiculo ?? { id: '', placa: b.placaVeiculo ?? '', modelo: b.tipoVeiculo ?? '', tipo: b.tipoVeiculo ?? '' },
    data: b.data,
    horario: b.horario,
    protocolo: b.protocolo,
    status,
    observacao: b.observacao ?? undefined,
    criadoEm: b.criadoEm,
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
      api.get('/agendamento/dis', { params }).then(r => setDis(r.data.map((d: any) => ({ ...d, cliente: d.cliente?.nome ?? d.cliente })))).catch(() => {}),
      api.get('/agendamento/motoristas', { params }).then(r => setMotoristas(r.data)).catch(() => {}),
      api.get('/agendamento/veiculos', { params }).then(r => setVeiculos(r.data)).catch(() => {}),
      api.get('/agendamento/transportadoras', { params }).then(r => setTransportadoras(r.data)).catch(() => {}),
      currentUser && [UserRole.CLIENTE, UserRole.DESPACHANTE, UserRole.TRANSPORTADORA].includes(currentUser.role)
        ? api.get('/agendamento/transportadoras-conta').then(r => setTransportadorasConta(r.data)).catch(() => {})
        : Promise.resolve(setTransportadorasConta([])),
      api.get('/agendamento/agendamentos', { params }).then(r => setActiveBookings(r.data.map(mapApiBooking))).catch(() => {}),
    ]).finally(() => setIsLoadingData(false));
  }, [clienteId, currentUser?.role]);

  const upsertDi = (di: DI) => {
    setDis(prev => {
      const exists = prev.some(d => d.nLote && d.nLote === di.nLote);
      if (exists) return prev.map(d => (d.nLote === di.nLote ? { ...d, ...di } : d));
      return [di, ...prev];
    });
    toast.info(`DI averbada: ${di.numeroDI}`);
  };

  useDisAverbadasStream(!!currentUser, upsertDi);

  const upsertBooking = (mapped: Agendamento) => {
    setActiveBookings(prev => {
      const exists = prev.some(b => b.id === mapped.id);
      return exists ? prev.map(b => (b.id === mapped.id ? mapped : b)) : [mapped, ...prev];
    });
  };

  const handleAgendamentoEvent = (payload: any) => {
    if (payload?.deleted) {
      setActiveBookings(prev => prev.filter(b => b.id !== payload.id));
      return;
    }
    const isActive = ACTIVE_BOOKING_STATUSES.has(payload.status);
    if (!isActive) {
      setActiveBookings(prev => prev.filter(b => b.id !== payload.id));
      return;
    }
    upsertBooking(mapApiBooking(payload));
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

  const handleAddMotorista = async (m: Motorista) => {
    try {
      const { data: saved } = await api.post('/agendamento/motoristas', {
        nome: m.nome, cpf: m.cpf, cnh: m.cnh, telefone: m.telefone,
      });
      const created: Motorista = { id: saved.id, nome: saved.nome, cpf: saved.cpf, cnh: saved.cnh, telefone: saved.telefone };
      setMotoristas(prev => [created, ...prev.filter(x => x.cpf.replace(/\D/g, '') !== created.cpf.replace(/\D/g, ''))]);
    } catch {
      setMotoristas(prev => [m, ...prev]);
    }
  };

  const handleAddVeiculo = async (v: Veiculo) => {
    try {
      const { data: saved } = await api.post('/agendamento/veiculos', {
        placa: v.placa, modelo: v.modelo, tipo: v.tipo,
      });
      const created: Veiculo = { id: saved.id, placa: saved.placa, modelo: saved.modelo, tipo: saved.tipo };
      setVeiculos(prev => [created, ...prev.filter(x => x.placa.toUpperCase() !== created.placa.toUpperCase())]);
    } catch {
      setVeiculos(prev => [v, ...prev]);
    }
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
    const cpfDigits = dados.cpfMotorista.replace(/\D/g, '');
    const motorista: Motorista =
      motoristas.find(m => m.cpf.replace(/\D/g, '') === cpfDigits) ??
      { id: `mot-${Date.now()}`, nome: dados.nomeMotorista, cpf: dados.cpfMotorista, cnh: '', telefone: '' };

    const veiculo: Veiculo =
      veiculos.find(v => v.placa.replace(/\s/g, '').toUpperCase() === dados.placaVeiculo.replace(/\s/g, '').toUpperCase()) ??
      { id: `veic-${Date.now()}`, placa: dados.placaVeiculo, modelo: dados.tipoVeiculo, tipo: dados.tipoVeiculo };

    const protocolo = `AG-${Date.now().toString(36).toUpperCase()}`;
    const localBooking: Agendamento = {
      id: `bk-${Date.now()}`,
      diId: '',
      diNumero: Array.isArray(dados.di) ? dados.di.join(', ') : (dados.di ?? ''),
      diCliente: (isAdmin ? selectedClient : (userClienteNome ?? dados.empresa)) || dados.empresa,
      container: dados.container || '',
      motorista,
      veiculo,
      data: dados.dataAgendamento,
      horario: dados.inicio,
      protocolo,
      status: 'ATIVO',
      observacao: dados.observacoes || undefined,
      criadoEm: new Date().toISOString(),
      operacao: dados.operacao,
      subOperacao: dados.subOperacao,
      cargaEspecial: dados.cargaEspecial,
      servicos: dados.servicos,
      empresa: dados.empresa,
      awbMawb: dados.awbMawb,
      dta: dados.dta,
      hawb: dados.hawb,
      numeroVoo: dados.numeroVoo,
      volumes: dados.volumes,
      peso: dados.peso,
      consignatario: dados.consignatario,
      transportadora: dados.transportadora,
    };

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
