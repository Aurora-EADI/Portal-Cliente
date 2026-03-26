'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { SimulationsSelectionPage } from '@/components/pages/simulacoes/SimulationsSelectionPage';

export default function SimulationsPage() {
    return (
        <ModuleRouteShell>
            <SimulationsSelectionPage />
        </ModuleRouteShell>
    );
}
