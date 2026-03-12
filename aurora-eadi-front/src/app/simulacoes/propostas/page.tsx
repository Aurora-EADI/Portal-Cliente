'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { PropostasKanban } from '@/components/pages/comercial/PropostasKanban';

export default function PropostasPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout maxWidth="full">
                <PropostasKanban />
            </Layout>
        </div>
    );
}
