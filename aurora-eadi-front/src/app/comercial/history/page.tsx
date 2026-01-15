'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { SimulationHistory } from '@/components/pages/comercial/SimulationHistory';

export default function SimulationHistoryPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <SimulationHistory />
            </Layout>
        </div>
    );
}
