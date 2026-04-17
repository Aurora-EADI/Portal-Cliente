'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { MaritimeSimulator } from '@/components/pages/comercial/MaritimeSimulator';

export default function ComercialSimuladorPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <MaritimeSimulator />
            </Layout>
        </div>
    );
}
