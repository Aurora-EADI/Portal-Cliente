'use client';

import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { MaritimeSimulator } from '@/components/pages/comercial/MaritimeSimulator';
import { UserRole } from '@/types';

export default function MaritimeSimulatorPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <MaritimeSimulator />
            </Layout>
        </div>
    );
}
