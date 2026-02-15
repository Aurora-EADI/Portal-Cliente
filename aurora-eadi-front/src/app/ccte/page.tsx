'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { CcteDashboard } from '@/components/pages/ccte/CcteDashboard';

export default function CctePage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <CcteDashboard />
      </Layout>
    </div>
  );
}
