'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { CcteDashboard } from '@/components/pages/dta/CcteDashboard';

export default function CctePainelPage() {
    return (
        <ModuleRouteShell>
            <CcteDashboard />
        </ModuleRouteShell>
    );
}
