'use client'

import React from 'react';
import { ModuleRouteShell } from '@/components/layout/ModuleRouteShell';
import { ReceptionLandingPage } from '@/components/pages/reception/ReceptionLandingPage';

export default function ReceptionMainPage() {
    return (
        <ModuleRouteShell>
            <div className="p-8">
                <ReceptionLandingPage />
            </div>
        </ModuleRouteShell>
    );
}
