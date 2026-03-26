'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { PropostasKanban } from '@/components/pages/comercial/PropostasKanban';

export default function PropostasPage() {
    return (
        <ModuleRouteShell layout={{ maxWidth: 'full' }}>
            <PropostasKanban />
        </ModuleRouteShell>
    );
}
