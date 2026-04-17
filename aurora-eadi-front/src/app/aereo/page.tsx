'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { AereoSelectionPage } from '@/components/pages/aereo/AereoSelectionPage';

export default function AereoPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <AereoSelectionPage />
            </Layout>
        </div>
    );
}
