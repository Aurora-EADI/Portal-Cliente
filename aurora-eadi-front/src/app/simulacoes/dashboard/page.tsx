'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { Dashboard } from '@/components/pages/simulacoes/Dashboard';

export default function SimulacoesDashboardPage() {
    return (
        <ModuleRouteShell>
            <Dashboard />
        </ModuleRouteShell>
    );
}
