'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { ComercialSelectionPage } from '@/components/pages/comercial/ComercialSelectionPage';

export default function ComercialPage() {
    return (
        <ModuleRouteShell>
            <ComercialSelectionPage />
        </ModuleRouteShell>
    );
}
