'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AirSimulationHistory } from '@/components/pages/aereo/AirSimulationHistory';

export default function AirSimulationHistoryPage() {
    return (
        <ModuleRouteShell>
            <AirSimulationHistory />
        </ModuleRouteShell>
    );
}
