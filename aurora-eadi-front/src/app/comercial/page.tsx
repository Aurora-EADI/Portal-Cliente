'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { ComercialSelectionPage } from '@/components/pages/comercial/ComercialSelectionPage';

export default function ComercialPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <ComercialSelectionPage />
            </Layout>
        </div>
    );
}
