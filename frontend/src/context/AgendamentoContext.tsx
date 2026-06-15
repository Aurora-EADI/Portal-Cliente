'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DI, Motorista, Veiculo, Agendamento, JanelaAtendimento } from '@/types/agendamento';
import { INITIAL_DIS, INITIAL_MOTORISTAS, INITIAL_VEICULOS, getInitialAgendamentos, DEFAULT_JANELAS_ATENDIMENTO } from '@/lib/agendamento';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { api } from '@/lib/api';
import { useAgendamentoWizard } from '@/store/agendamento-wizard.store';

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

export const CLIENTS = [
  'Global Importações e Logística Ltda',
  'Tecnologia Avançada Brasil S.A.',
  'Siderúrgica Rio Grande Ltda',
  'AgroComercial Sul-Sudeste',
  'Indústria Química Catarinense Ltda',
  'AutoParts Importadora S/A',
];

interface AgendamentoContextValue {
  dis: DI[];
  motoristas: Motorista[];
  veiculos: Veiculo[];
  activeBookings: Agendamento[];
  visibleDis: DI[];
  visibleBookings: Agendamento[];
  isAdmin: boolean;
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
  saveSelectedJanelaIdToStorage: (id: string) => void;
  handleAddMotorista: (m: Motorista) => void;
  handleAddVeiculo: (v: Veiculo) => void;
  handleCancelBooking: (id: string) => void;
  handleConfirmBooking: (data: string, horario: string) => Promise<void>;
  handleResetWizard: () => void;
  handleResetAllData: () => void;
  reservaAtiva: { id: string; expiraEm: string } | null;
  criarReserva: (data: string, horario: string, vagasTotais: number) => Promise<void>;
  liberarReserva: () => Promise<void>;
}

const AgendamentoContext = createContext<AgendamentoContextValue | undefined>(undefined);

function mapApiBooking(b: any): Agendamento {
  return {
    id: b.id,
    diId: b.diId,
    diNumero: b.di?.numeroDI ?? b.diNumero ?? '',
    diCliente: b.di?.cliente?.nome ?? b.diCliente ?? '',
    container: b.di?.container ?? b.container ?? '',
    motorista: b.motorista,
    veiculo: b.veiculo,
    data: b.data,
    horario: b.horario,
    protocolo: b.protocolo,
    criadoEm: b.criadoEm,
  };
}

export function AgendamentoProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuthContext();
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.EMPLOYEE;
  const userClienteNome = currentUser?.cliente?.nome ?? null;
  const clienteId = (!isAdmin && currentUser?.cliente?.id) ? currentUser.cliente.id : undefined;

  // --- server data (não persiste, carregado do backend) ---
  const [dis, setDis] = useState<DI[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [activeBookings, setActiveBookings] = useState<Agendamento[]>([]);
  const [janelasAtendimento, setJanelasAtendimento] = useState<JanelaAtendimento[]>([]);

  // --- wizard state via Zustand store (persiste entre navegações) ---
  const {
    currentStep, setCurrentStep,
    selectedDI, setSelectedDI,
    selectedMotorista, setSelectedMotorista,
    selectedVeiculo, setSelectedVeiculo,
    reservaAtiva, setReservaAtiva,
    selectedJanelaId, setSelectedJanelaId,
    selectedClient: storedClient, setSelectedClient: storeSetClient,
    successBooking, setSuccessBooking,
    viewingArchiveBooking, setViewingArchiveBooking,
    resetWizard,
  } = useAgendamentoWizard();

  // inicializar selectedClient a partir do usuário logado, se ainda não definido
  const selectedClient = isAdmin
    ? (storedClient || CLIENTS[0])
    : (userClienteNome ?? storedClient ?? CLIENTS[0]);

  // --- carregar dados do backend ---
  useEffect(() => {
    if (MOCK_MODE) {
      setDis(INITIAL_DIS);
      setMotoristas(INITIAL_MOTORISTAS);
      setVeiculos(INITIAL_VEICULOS);
      setActiveBookings(getInitialAgendamentos());
      setJanelasAtendimento(DEFAULT_JANELAS_ATENDIMENTO);
      return;
    }

    api.get('/agendamento/janelas').then(r => setJanelasAtendimento(r.data)).catch(() => setJanelasAtendimento(DEFAULT_JANELAS_ATENDIMENTO));
    const loadLocal = <T,>(key: string, fallback: T): T => {
      try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
    };

    api.get('/agendamento/dis', { params: clienteId ? { clienteId } : {} }).then(r => setDis(r.data)).catch(() => setDis(loadLocal('eadi_dis', INITIAL_DIS)));
    api.get('/agendamento/motoristas', { params: clienteId ? { clienteId } : {} }).then(r => setMotoristas(r.data)).catch(() => setMotoristas(loadLocal('eadi_motoristas', INITIAL_MOTORISTAS)));
    api.get('/agendamento/veiculos', { params: clienteId ? { clienteId } : {} }).then(r => setVeiculos(r.data)).catch(() => setVeiculos(loadLocal('eadi_veiculos', INITIAL_VEICULOS)));
    api.get('/agendamento/agendamentos', { params: clienteId ? { clienteId } : {} })
      .then(r => setActiveBookings(r.data.map(mapApiBooking)))
      .catch(() => setActiveBookings(getInitialAgendamentos()));
  }, [clienteId]);

  const saveJanelasToStorage = (list: JanelaAtendimento[]) => {
    setJanelasAtendimento(list);
    if (!MOCK_MODE) return;
    localStorage.setItem('eadi_janelas', JSON.stringify(list));
  };

  const saveSelectedJanelaIdToStorage = (id: string) => {
    setSelectedJanelaId(id);
  };

  const setSelectedClient = (c: string) => {
    storeSetClient(c);
  };

  const handleAddMotorista = async (m: Motorista) => {
    setMotoristas(prev => {
      const updated = [m, ...prev];
      localStorage.setItem('eadi_motoristas', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddVeiculo = async (v: Veiculo) => {
    setVeiculos(prev => {
      const updated = [v, ...prev];
      localStorage.setItem('eadi_veiculos', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCancelBooking = async (id: string) => {
    if (!MOCK_MODE) {
      try { await api.patch(`/agendamento/agendamentos/${id}/cancelar`); } catch { /* ignore */ }
    }
    setActiveBookings(prev => prev.filter(b => b.id !== id));
    if (successBooking?.id === id) { setSuccessBooking(null); setCurrentStep(1); }
    if (viewingArchiveBooking?.id === id) setViewingArchiveBooking(null);
  };

  const handleConfirmBooking = async (data: string, horario: string) => {
    if (!selectedDI || !selectedMotorista || !selectedVeiculo) return;

    if (MOCK_MODE) {
      const cleanedDate = data.replace(/-/g, '');
      const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
      const diCode = selectedDI.numeroDI.replace(/[^A-Z0-9]/g, '').slice(2, 8);
      const protocolo = `FCL-${cleanedDate}-${diCode}-${randomHash}`;
      const newBooking: Agendamento = {
        id: `bk-${Date.now()}`, diId: selectedDI.id, diNumero: selectedDI.numeroDI,
        diCliente: selectedDI.cliente, container: selectedDI.container,
        motorista: selectedMotorista, veiculo: selectedVeiculo,
        data, horario, protocolo, criadoEm: new Date().toISOString(),
      };
      setActiveBookings(prev => [newBooking, ...prev]);
      setSuccessBooking(newBooking);
      setReservaAtiva(null);
      return;
    }

    const { data: booking } = await api.post('/agendamento/agendamentos', {
      diId: selectedDI.id,
      motoristaId: selectedMotorista.id,
      veiculoId: selectedVeiculo.id,
      data,
      horario,
    });
    const mapped = mapApiBooking(booking);
    setActiveBookings(prev => [mapped, ...prev]);
    setSuccessBooking(mapped);
    setViewingArchiveBooking(null);
    // hold já foi deletado no backend; limpar frontend
    setReservaAtiva(null);
  };

  const criarReserva = async (data: string, horario: string, vagasTotais: number) => {
    if (!selectedDI) throw new Error('Nenhuma DI selecionada');
    if (reservaAtiva) await liberarReserva();

    if (MOCK_MODE) {
      const novaReserva = { id: `mock-reserva-${Date.now()}`, expiraEm: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
      setReservaAtiva(novaReserva);
      return;
    }

    const { data: reserva } = await api.post('/agendamento/reservas', {
      data, horario, diId: selectedDI.id, vagasTotais,
    });
    setReservaAtiva({ id: reserva.id, expiraEm: reserva.expiraEm });
  };

  const liberarReserva = async () => {
    if (!reservaAtiva) return;
    const id = reservaAtiva.id;
    setReservaAtiva(null);
    if (MOCK_MODE) return;
    try { await api.delete(`/agendamento/reservas/${id}`); } catch { /* already expired */ }
  };

  const handleResetWizard = () => {
    resetWizard();
  };

  const handleResetAllData = () => {
    setDis(INITIAL_DIS);
    setMotoristas(INITIAL_MOTORISTAS);
    setVeiculos(INITIAL_VEICULOS);
    setActiveBookings(getInitialAgendamentos());
    setJanelasAtendimento(DEFAULT_JANELAS_ATENDIMENTO);
    resetWizard();
    storeSetClient(CLIENTS[0]);
    setSelectedJanelaId('all');
  };

  const effectiveClient = isAdmin ? selectedClient : (userClienteNome ?? selectedClient);
  const visibleDis = isAdmin
    ? dis.filter(d => d.cliente === selectedClient)
    : dis.filter(d => userClienteNome ? d.cliente === userClienteNome : true);
  const visibleBookings = isAdmin
    ? activeBookings.filter(b => b.diCliente === selectedClient)
    : activeBookings.filter(b => userClienteNome ? b.diCliente === userClienteNome : true);

  return (
    <AgendamentoContext.Provider value={{
      dis, motoristas, veiculos, activeBookings, janelasAtendimento,
      visibleDis, visibleBookings, isAdmin,
      selectedClient: effectiveClient, selectedJanelaId,
      currentStep, setCurrentStep, selectedDI, setSelectedDI,
      selectedMotorista, setSelectedMotorista, selectedVeiculo, setSelectedVeiculo,
      successBooking, setSuccessBooking, viewingArchiveBooking, setViewingArchiveBooking,
      setSelectedClient, saveJanelasToStorage, saveSelectedJanelaIdToStorage,
      handleAddMotorista, handleAddVeiculo, handleCancelBooking,
      handleConfirmBooking, handleResetWizard, handleResetAllData,
      reservaAtiva, criarReserva, liberarReserva,
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
