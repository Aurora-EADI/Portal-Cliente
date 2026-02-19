'use client';

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import {  } from '@/components/pages/dta/DtaSelectionPage';

export default function DtaSelectionPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <DtaSelectionPage />
      </Layout>
    </div>
  );
}
