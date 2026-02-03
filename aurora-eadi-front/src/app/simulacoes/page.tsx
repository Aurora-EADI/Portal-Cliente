'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { SimulationsSelectionPage } from '@/components/pages/simulacoes/SimulationsSelectionPage';

export default function SimulationsPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <SimulationsSelectionPage />
            </Layout>
        </div>
    );
}
