'use client';

import { Header } from '@/components/layout/Header';
import { SimulationsSelectionPage } from '@/components/pages/simulacoes/SimulationsSelectionPage';

export default function SimulationsPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <SimulationsSelectionPage />
        </div>
    );
}
