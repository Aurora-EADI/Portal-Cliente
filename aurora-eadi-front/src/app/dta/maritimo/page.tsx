'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { DtaMaritimoDashboard } from '@/components/pages/dta/DtaMaritimoDashboard';

export default function DtaMaritimoPainelPage() {
    return (
        <ModuleRouteShell>
            <DtaMaritimoDashboard />
        </ModuleRouteShell>
    );
}
