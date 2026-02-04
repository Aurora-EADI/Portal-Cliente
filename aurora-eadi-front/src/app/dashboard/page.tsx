'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { DashboardSelectionPage } from '@/components/pages/dashboard/DashboardSelectionPage';

export default function DashboardPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <DashboardSelectionPage />
            </Layout>
        </div>
    );
}
