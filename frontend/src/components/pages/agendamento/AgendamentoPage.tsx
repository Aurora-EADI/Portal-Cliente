'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { AgendamentoProvider } from '@/context/AgendamentoContext';
import { DashboardView } from './DashboardView';
import { WizardView } from './WizardView';
import { PortariaView } from './PortariaView';
import { DIDirectoryView } from './DIDirectoryView';
import { MotoristasView } from './MotoristasView';
import { ConfiguracaoView } from './ConfiguracaoView';
import { AtribuicaoTransportadorasView } from './AtribuicaoTransportadorasView';

function AgendamentoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuthContext();
  const tab = searchParams.get('tab') ?? 'dashboard';

  const isTransportadora = currentUser?.role === UserRole.TRANSPORTADORA;
  const isClienteOuDespachante = currentUser?.role === UserRole.CLIENTE || currentUser?.role === UserRole.DESPACHANTE;
  const isExternalUser = isClienteOuDespachante || isTransportadora;

  const blockedTab =
    (isExternalUser && (tab === 'config' || tab === 'gate' || tab === 'dis')) ||
    (isTransportadora && (tab === 'drivers' || tab === 'transportadoras')) ||
    (!isClienteOuDespachante && tab === 'transportadoras');

  React.useEffect(() => {
    if (blockedTab) {
      router.replace('/agendamento');
    }
  }, [blockedTab, router]);

  if (blockedTab) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 p-4 md:p-6">
      {tab === 'dashboard' && <DashboardView />}
      {tab === 'wizard'    && <WizardView />}
      {tab === 'gate'      && <PortariaView />}
      {tab === 'dis'       && <DIDirectoryView />}
      {tab === 'drivers'   && <MotoristasView />}
      {tab === 'transportadoras' && <AtribuicaoTransportadorasView />}
      {tab === 'config'    && <ConfiguracaoView />}
    </div>
  );
}

export function AgendamentoPage() {
  return (
    <AgendamentoProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      }>
        <AgendamentoContent />
      </Suspense>
    </AgendamentoProvider>
  );
}
