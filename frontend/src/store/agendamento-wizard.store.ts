import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DI, Motorista, Veiculo, Agendamento } from '@/types/agendamento';

interface SlotReservaAtiva {
  id: string;
  expiraEm: string;
}

interface AgendamentoWizardState {
  currentStep: number;
  selectedDI: DI | null;
  selectedMotorista: Motorista | null;
  selectedVeiculo: Veiculo | null;
  reservaAtiva: SlotReservaAtiva | null;
  selectedJanelaId: string;
  selectedClient: string;
  successBooking: Agendamento | null;
  viewingArchiveBooking: Agendamento | null;

  setCurrentStep: (s: number) => void;
  setSelectedDI: (di: DI | null) => void;
  setSelectedMotorista: (m: Motorista | null) => void;
  setSelectedVeiculo: (v: Veiculo | null) => void;
  setReservaAtiva: (r: SlotReservaAtiva | null) => void;
  setSelectedJanelaId: (id: string) => void;
  setSelectedClient: (c: string) => void;
  setSuccessBooking: (b: Agendamento | null) => void;
  setViewingArchiveBooking: (b: Agendamento | null) => void;
  resetWizard: () => void;
}

const WIZARD_INITIAL: Pick<
  AgendamentoWizardState,
  'currentStep' | 'selectedDI' | 'selectedMotorista' | 'selectedVeiculo' |
  'reservaAtiva' | 'successBooking' | 'viewingArchiveBooking'
> = {
  currentStep: 1,
  selectedDI: null,
  selectedMotorista: null,
  selectedVeiculo: null,
  reservaAtiva: null,
  successBooking: null,
  viewingArchiveBooking: null,
};

export const useAgendamentoWizard = create<AgendamentoWizardState>()(
  persist(
    (set) => ({
      ...WIZARD_INITIAL,
      selectedJanelaId: 'all',
      selectedClient: '',

      setCurrentStep: (s) => set({ currentStep: s }),
      setSelectedDI: (di) => set({ selectedDI: di }),
      setSelectedMotorista: (m) => set({ selectedMotorista: m }),
      setSelectedVeiculo: (v) => set({ selectedVeiculo: v }),
      setReservaAtiva: (r) => set({ reservaAtiva: r }),
      setSelectedJanelaId: (id) => set({ selectedJanelaId: id }),
      setSelectedClient: (c) => set({ selectedClient: c, selectedDI: null }),
      setSuccessBooking: (b) => set({ successBooking: b }),
      setViewingArchiveBooking: (b) => set({ viewingArchiveBooking: b }),
      resetWizard: () => set(WIZARD_INITIAL),
    }),
    {
      name: 'agendamento-wizard',
      partialize: (state) => ({
        currentStep: state.currentStep,
        selectedDI: state.selectedDI,
        selectedMotorista: state.selectedMotorista,
        selectedVeiculo: state.selectedVeiculo,
        reservaAtiva: state.reservaAtiva,
        selectedJanelaId: state.selectedJanelaId,
        selectedClient: state.selectedClient,
        successBooking: state.successBooking,
      }),
    }
  )
);
