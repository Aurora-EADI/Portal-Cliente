'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { AereoSelectionPage } from '@/components/pages/aereo/AereoSelectionPage';

export default function AereoPage() {
    return (
        <ModuleRouteShell>
            <AereoSelectionPage />
        </ModuleRouteShell>
    );
}
