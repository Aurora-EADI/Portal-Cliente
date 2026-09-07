'use client';

import { RoleGuard } from '@/components/guards/RoleGuard';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { EmConstrucao } from '@/components/pages/averbacao/EmConstrucao';
import { UserRole } from '@/types';

// So o Despachante abre averbacao, e apenas em nome de cliente com procuracao
// APROVADA — regra que o backend revalida (403).
export default function NovaAverbacaoRoute() {
  return (
    <RoleGuard allowedRoles={[UserRole.DESPACHANTE]}>
      <ModuleRouteShell
        layout={{ maxWidth: 'full' }}
        header={{ pageTitle: 'Nova Averbação' }}
      >
        <EmConstrucao
          titulo="Nova Averbação"
          descricao="O formulário de 3 steps com anexo de documentos chega na Fase 3, junto com os componentes Stepper e FileUpload."
        />
      </ModuleRouteShell>
    </RoleGuard>
  );
}
