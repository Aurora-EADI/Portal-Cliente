"use client"

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { PermissionRouteGuard } from '@/components/guards/PermissionRouteGuard';
import { WorkforceList } from '@/components/pages/fornecedor/terceiros/WorkforceList';

export default function SupplierWorkforcePage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PermissionRouteGuard moduleRoute="/fornecedor" requiredPermissions={['FOR_VIEW_LIST']}>
        <Header />
        <Layout>
          <WorkforceList />
        </Layout>
      </PermissionRouteGuard>
    </div>
  );
}
