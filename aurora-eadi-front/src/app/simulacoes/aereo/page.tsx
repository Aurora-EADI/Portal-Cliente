'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AirSimulator } from '@/components/pages/aereo/AirSimulator';

export default function SimulacoesAereoPage() {
    return (
        <ModuleRouteShell>
            <AirSimulator />
        </ModuleRouteShell>
    );
}
