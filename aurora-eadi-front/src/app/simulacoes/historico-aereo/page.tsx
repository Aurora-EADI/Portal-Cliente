'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { AirSimulationHistory } from '@/components/pages/aereo/AirSimulationHistory';

export default function SimulacoesHistoricoAereoPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <AirSimulationHistory />
            </Layout>
        </div>
    );
}
