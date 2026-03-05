"use client"

import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { WorkforceList } from '@/components/pages/fornecedor/terceiros/WorkforceList';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

export default function DocumentosColaboradoresPage() {
  const { currentUser } = useAuthContext();
  const isSupplier = currentUser?.role === UserRole.SUPPLIER;

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER]} redirectTo="/documentos">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <Layout>
          <WorkforceList
            companyId={isSupplier && currentUser?.companyId ? String(currentUser.companyId) : undefined}
            hideCompanyColumn={isSupplier}
            showAddButton={isSupplier}
            title={isSupplier ? 'Colaboradores' : 'Colaboradores de Terceiros'}
            description={
              isSupplier
                ? 'Visualize e gerencie os terceirizados da sua empresa.'
                : 'Visualize todos os colaboradores cadastrados por terceiros.'
            }
          />
        </Layout>
      </div>
    </RoleGuard>
  );
}
