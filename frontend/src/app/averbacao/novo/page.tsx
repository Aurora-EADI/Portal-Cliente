'use client';

import { useState } from 'react';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { FileUpload, Stepper, type Step } from '@/components/ui';
import { UserRole } from '@/types';

const STEPS: Step[] = [
  { id: 1, label: 'Dados da DI', description: 'Modalidade, DI/DUIMP e importador' },
  { id: 2, label: 'Documentos', description: 'Anexos exigidos pela modalidade' },
  { id: 3, label: 'Revisão', description: 'Conferir e enviar para análise' },
];

/**
 * Ainda e um stub: o formulario real chega na Fase 3, junto com os tipos de
 * documento vindos do Aurora. O que ja esta aqui sao os dois componentes que a
 * tela vai usar, montados de verdade — e assim da para ver se funcionam antes
 * de haver dados.
 */
function NovaAverbacaoStub() {
  const [etapa, setEtapa] = useState(0);
  const [arquivo, setArquivo] = useState<File | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Nova Averbação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O formulário completo chega na Fase 3. Abaixo, os componentes que ele vai usar.
        </p>
      </div>

      <Stepper steps={STEPS} current={etapa} onStepClick={setEtapa} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEtapa((e) => Math.max(0, e - 1))}
          disabled={etapa === 0}
          className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => setEtapa((e) => Math.min(STEPS.length - 1, e + 1))}
          disabled={etapa === STEPS.length - 1}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          Avançar
        </button>
      </div>

      <FileUpload
        value={arquivo}
        onChange={setArquivo}
        accept={['application/pdf']}
        label="Anexar documento"
        hint="Arraste o PDF aqui ou clique para escolher"
      />
    </div>
  );
}

export default function NovaAverbacaoRoute() {
  return (
    <RoleGuard allowedRoles={[UserRole.DESPACHANTE]}>
      <ModuleRouteShell layout={{ maxWidth: 'full' }} header={{ pageTitle: 'Nova Averbação' }}>
        <NovaAverbacaoStub />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
