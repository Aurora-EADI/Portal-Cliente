'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { DashboardSelectionPage } from '@/components/pages/dashboard/DashboardSelectionPage';

export default function DashboardPage() {
    return (
        <ModuleRouteShell>
            <DashboardSelectionPage />
        </ModuleRouteShell>
    );
}
