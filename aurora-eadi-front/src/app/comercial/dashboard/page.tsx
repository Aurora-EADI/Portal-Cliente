'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { Dashboard } from '@/components/pages/simulacoes/Dashboard';

export default function ComercialDashboardPage() {
    return (
        <ModuleRouteShell>
            <Dashboard />
        </ModuleRouteShell>
    );
}
