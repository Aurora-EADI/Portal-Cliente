'use client';

import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { MaritimeSimulator } from '@/components/pages/comercial/MaritimeSimulator';

export default function SimulacoesMaritimosPage() {
    return (
        <ModuleRouteShell>
            <MaritimeSimulator />
        </ModuleRouteShell>
    );
}
