'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AirSimulator } from '@/components/pages/aereo/AirSimulator';

export default function AereoSimuladorPage() {
    return (
        <ModuleRouteShell>
            <AirSimulator />
        </ModuleRouteShell>
    );
}
