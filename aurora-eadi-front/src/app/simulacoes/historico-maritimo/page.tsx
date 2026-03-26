'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { SimulationHistory } from '@/components/pages/comercial/SimulationHistory';

export default function SimulacoesHistoricoMaritimoPage() {
    return (
        <ModuleRouteShell>
            <SimulationHistory />
        </ModuleRouteShell>
    );
}
