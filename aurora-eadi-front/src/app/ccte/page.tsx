'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { CcteSelectionPage } from '@/components/pages/ccte/CcteSelectionPage';

export default function CctePage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <CcteSelectionPage />
      </Layout>
    </div>
  );
}
