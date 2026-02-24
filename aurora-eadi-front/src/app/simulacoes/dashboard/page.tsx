'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/components/pages/simulacoes/Dashboard';

export default function SimulacoesDashboardPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <Dashboard />
            </Layout>
        </div>
    );
}
