'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { DtaMaritimoDashboard } from '@/components/pages/dta/DtaMaritimoDashboard';

export default function DtaMaritimoPainelPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <DtaMaritimoDashboard />
            </Layout>
        </div>
    );
}
