'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { AirSimulator } from '@/components/pages/aereo/AirSimulator';

export default function SimulacoesAereoPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <AirSimulator />
            </Layout>
        </div>
    );
}
