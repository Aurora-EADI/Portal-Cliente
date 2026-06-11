'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAgendamento } from '@/context/AgendamentoContext';
import { StepIndicator } from './steps/StepIndicator';
import { DIStep } from './steps/DIStep';
import { DriverStep } from './steps/DriverStep';
import { SchedulingStep } from './steps/SchedulingStep';
import { SuccessVoucher } from './steps/SuccessVoucher';

const wizardSteps = [
  { number: 1, title: 'Seleção da DI', subtitle: 'Verificar container' },
  { number: 2, title: 'Dados do Motorista', subtitle: 'CPF e Placa do veículo' },
  { number: 3, title: 'Agendamento', subtitle: 'Escolha data e hora' },
];

export function WizardView() {
  const router = useRouter();
  const {
    dis, activeBookings, visibleDis, visibleBookings, motoristas, veiculos, janelasAtendimento, selectedJanelaId,
    selectedClient, currentStep, setCurrentStep,
    selectedDI, setSelectedDI, selectedMotorista, setSelectedMotorista,
    selectedVeiculo, setSelectedVeiculo, successBooking, viewingArchiveBooking,
    handleAddMotorista, handleAddVeiculo, handleConfirmBooking, handleResetWizard,
    reservaAtiva, criarReserva, liberarReserva,
  } = useAgendamento();

  const onResetWizard = () => {
    handleResetWizard();
    router.push('/agendamento?tab=gate');
  };

  const clientDis = visibleDis;
  const clientBookings = visibleBookings;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-zinc-200 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-[#78411D] tracking-tight">Programar Retirada de Container (FCL)</h2>
          <p className="text-xs text-zinc-500 mt-1">Siga as três etapas para homologar a liberação de portaria</p>
        </div>
        {(selectedDI || selectedMotorista) && !successBooking && (
          <button
            onClick={() => { if (confirm('Deseja reiniciar o fluxo?')) onResetWizard(); }}
            className="text-xs text-red-600 hover:text-red-800 hover:underline font-bold bg-red-50 py-1.5 px-3 rounded-lg border border-red-100"
          >
            Reiniciar Fluxo
          </button>
        )}
      </div>

      {!successBooking && !viewingArchiveBooking ? (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <StepIndicator currentStep={currentStep} steps={wizardSteps} />
          <div className="p-4 md:p-6">
            {currentStep === 1 && (
              <DIStep
                dis={clientDis}
                activeBookings={clientBookings}
                selectedDI={selectedDI}
                onSelectDI={setSelectedDI}
                onNext={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 2 && (
              <DriverStep
                motoristas={motoristas}
                onAddMotorista={handleAddMotorista}
                selectedMotorista={selectedMotorista}
                onSelectMotorista={setSelectedMotorista}
                veiculos={veiculos}
                onAddVeiculo={handleAddVeiculo}
                selectedVeiculo={selectedVeiculo}
                onSelectVeiculo={setSelectedVeiculo}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 3 && selectedDI && selectedMotorista && selectedVeiculo && (
              <SchedulingStep
                selectedDI={selectedDI}
                selectedMotorista={selectedMotorista}
                selectedVeiculo={selectedVeiculo}
                activeBookings={activeBookings}
                janelasAtendimento={janelasAtendimento}
                selectedJanelaId={selectedJanelaId}
                reservaAtiva={reservaAtiva}
                onReservarSlot={criarReserva}
                onLiberarReserva={liberarReserva}
                onConfirmBooking={handleConfirmBooking}
                onBack={async () => { await liberarReserva(); setCurrentStep(2); }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 p-4 md:p-6 rounded-xl shadow-sm">
          {successBooking && <SuccessVoucher booking={successBooking} onReset={onResetWizard} />}
        </div>
      )}
    </div>
  );
}
