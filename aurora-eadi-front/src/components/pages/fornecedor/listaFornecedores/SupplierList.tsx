import React, { useState } from 'react';
import { useSuppliers, useUpdateCompanyStatus } from "@/hooks/useSuppliers";
import { CompanyWithResponsible } from '@/services/api';
import { CompanyStatus } from '@/types';
import { Badge } from "@/components/ui/Badge";
import { Building2, User as UserIcon, FileText, ShieldCheck, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { CompanyDetailsModal } from './components/CompanyDetailsModal';
import { AuthorizationModal } from './components/AuthorizationModal';
import {
    DataTable,
    Column,
    SearchBar,
    StatusCards,
    StatusCardConfig,
    PageHeader,
} from '@/components/ui/DataTable';

const STATUS_CARDS: StatusCardConfig[] = [
    {
        status: CompanyStatus.ACTIVE,
        label: 'Ativo',
        icon: CheckCircle,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
    },
    {
        status: CompanyStatus.PENDING_ACTIVE,
        label: 'Em Aprovacao',
        icon: AlertCircle,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
    },
    {
        status: CompanyStatus.REJECTED,
        label: 'Rejeitado',
        icon: XCircle,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
    },
];

export function SupplierList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const limit = 10;

    const { data, isLoading, isError } = useSuppliers({
        page,
        limit,
        search,
        status: statusFilter || undefined
    });
    const { mutateAsync: updateCompany, isPending: isUpdating } = useUpdateCompanyStatus();

    const [viewingCompany, setViewingCompany] = useState<CompanyWithResponsible | null>(null);
    const [authorizingCompany, setAuthorizingCompany] = useState<CompanyWithResponsible | null>(null);

    const suppliers = data?.data || [];
    const pagination = data?.pagination;
    const statusCounts = data?.statusCounts || {};

    const handleAuthorization = async (status: CompanyStatus) => {
        if (!authorizingCompany) return;
        try {
            await updateCompany({ id: String(authorizingCompany.company.id), status });
            setAuthorizingCompany(null);
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleClear = () => {
        setStatusFilter('');
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStatusCardClick = (status: string) => {
        if (statusFilter === status) {
            setStatusFilter('');
        } else {
            setStatusFilter(status);
        }
        setPage(1);
    };

    const columns: Column<CompanyWithResponsible>[] = [
        {
            key: 'empresa',
            header: 'Empresa',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{item.company.fantasyName}</div>
                        <div className="text-xs text-gray-500">{item.company.cnpj}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'responsavel',
            header: 'Responsavel',
            render: (item) => (
                <div className="flex items-center gap-2 text-gray-600">
                    <UserIcon size={14} className="text-gray-400" />
                    {item.responsible ? item.responsible.name : '-'}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (item) => <Badge status={item.company.status} context="company" />,
        },
        {
            key: 'detalhes',
            header: 'Detalhes',
            align: 'center',
            render: (item) => (
                <button
                    onClick={() => setViewingCompany(item)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                >
                    <FileText size={16} />
                    Detalhes
                </button>
            ),
        },
        {
            key: 'autorizacao',
            header: 'Autorizacao',
            align: 'center',
            render: (item) => (
                <button
                    onClick={() => setAuthorizingCompany(item)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                    title="Gerenciar Acesso"
                >
                    <ShieldCheck size={16} />
                    Gerenciar
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <PageHeader
                title="Lista de Fornecedores"
                description="Gerencie os fornecedores cadastrados e seus acessos."
            />

            <StatusCards
                cards={STATUS_CARDS}
                statusCounts={statusCounts}
                activeStatus={statusFilter}
                onStatusClick={handleStatusCardClick}
                columns={3}
            />

            <div className="space-y-3">
                <SearchBar
                    placeholder="Buscar por nome fantasia, razao social e CNPJ"
                    onSearch={handleSearch}
                    onClear={handleClear}
                    showClearButton={!!(search || statusFilter)}
                />
            </div>

            <DataTable
                columns={columns}
                data={suppliers}
                keyExtractor={(item) => item.company.id}
                isLoading={isLoading}
                isError={isError}
                errorMessage="Erro ao carregar fornecedores."
                emptyMessage="Nenhum fornecedor encontrado."
                pagination={pagination ? {
                    page,
                    total: pagination.total,
                    limit,
                    onPageChange: handlePageChange,
                } : undefined}
                rowClassName={(item) =>
                    item.company.status === CompanyStatus.PENDING ? 'bg-orange-50/30' : ''
                }
            />

            {viewingCompany && (
                <CompanyDetailsModal
                    companyData={viewingCompany}
                    onClose={() => setViewingCompany(null)}
                />
            )}

            {authorizingCompany && (
                <AuthorizationModal
                    companyData={authorizingCompany}
                    onClose={() => setAuthorizingCompany(null)}
                    onAuthorize={handleAuthorization}
                    isUpdating={isUpdating}
                />
            )}
        </div>
    );
}
