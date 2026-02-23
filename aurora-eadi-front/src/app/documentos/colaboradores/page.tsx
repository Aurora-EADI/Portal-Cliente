"use client"

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { WorkforceList } from '@/components/pages/fornecedor/terceiros/WorkforceList';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

export default function DocumentosColaboradoresPage() {
  const { currentUser } = useAuthContext();

  return (
    <RoleGuard allowedRoles={[UserRole.SUPPLIER]} redirectTo="/documentos">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <WorkforceList
            companyId={currentUser?.companyId ? String(currentUser.companyId) : undefined}
            hideCompanyColumn
            showAddButton
            title="Colaboradores"
            description="Visualize e gerencie os terceirizados da sua empresa."
          />
        </Layout>
      </div>
    </RoleGuard>
  );
}
