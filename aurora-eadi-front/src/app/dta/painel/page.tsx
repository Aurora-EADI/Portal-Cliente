'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { CcteDashboard } from '@/components/pages/dta/CcteDashboard';

export default function CctePainelPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <CcteDashboard />
            </Layout>
        </div>
    );
}
