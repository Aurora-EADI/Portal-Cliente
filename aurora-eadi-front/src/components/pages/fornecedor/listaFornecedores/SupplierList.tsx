import React, { useState } from 'react';
import { useSuppliers, useUpdateCompanyStatus } from "@/hooks/useSuppliers";
import { CompanyWithResponsible } from '@/services/api';
import { CompanyStatus } from '@/types';
import { Badge } from "@/components/ui/Badge";
import { Loader2, Eye, ShieldCheck, Building2, User as UserIcon, FileText, Search, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { CompanyDetailsModal } from './components/CompanyDetailsModal';
import { AuthorizationModal } from './components/AuthorizationModal';
import { formatNumber } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';

// Configuração dos cards de status
const STATUS_CARDS = [
    {
        status: CompanyStatus.ACTIVE,
        label: 'Ativo',
        icon: CheckCircle,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
    },
    // {
    //     status: CompanyStatus.PENDING,
    //     label: 'Pendente',
    //     icon: Clock,
    //     bgColor: 'bg-orange-100',
    //     textColor: 'text-orange-600',
    // },
    {
        status: CompanyStatus.PENDING_ACTIVE,
        label: 'Em Aprovação',
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
    const [searchInput, setSearchInput] = useState('');
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStatusCardClick = (status: string) => {
        // Se clicar no card já filtrado, remove o filtro
        if (statusFilter === status) {
            setStatusFilter('');
        } else {
            setStatusFilter(status);
        }
        setPage(1);
    };

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-md bg-red-50 p-4 text-center text-red-600">
                Erro ao carregar fornecedores.
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Lista de Fornecedores</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie os fornecedores cadastrados e seus acessos.
                    </p>
                </div>
            </div>

            {/* Status Cards - Dinâmicos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STATUS_CARDS.map((card) => {
                    const count = statusCounts[card.status] || 0;
                    const isActive = statusFilter === card.status;
                    const Icon = card.icon;

                    return (
                        <button
                            key={card.status}
                            onClick={() => handleStatusCardClick(card.status)}
                            className={`bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${isActive
                                ? 'border-primary-500 ring-2 ring-primary-200'
                                : 'border-gray-200'
                                }`}
                        >
                            <div className={`p-3 ${card.bgColor} ${card.textColor} rounded-lg`}>
                                <Icon size={16} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-gray-500">{card.label}</p>
                                <p className="text-xl font-bold text-gray-900">{formatNumber(count)}</p>
                            </div>
                            {isActive && (
                                <div className="ml-auto">
                                    <CheckCircle size={20} className="text-primary-600" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome fantasia, razão social e CNPJ"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                        Buscar
                    </button>
                    {(search || statusFilter) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSearchInput('');
                                setStatusFilter('');
                                setPage(1);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Limpar
                        </button>
                    )}
                </form>

                {/* Status Filter - Agora sincronizado com os cards */}
                {/* <div className="flex items-center gap-2">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                        Filtrar por Status:
                    </label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    >
                        <option value="">Todos os Status</option>
                        <option value={CompanyStatus.PENDING}>Pendente</option>
                        <option value={CompanyStatus.PENDING_ACTIVE}>Em Aprovação</option>
                        <option value={CompanyStatus.ACTIVE}>Ativo</option>
                        <option value={CompanyStatus.REJECTED}>Rejeitado</option>
                    </select>
                    {statusFilter && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                            <span>Filtrando: </span>
                            <Badge status={statusFilter as CompanyStatus} context="company" />
                        </div>
                    )}
                </div> */}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Empresa</th>
                            <th className="px-6 py-4">Responsável</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Detalhes</th>
                            <th className="px-6 py-4 text-center">Autorização</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {suppliers && suppliers.length > 0 ? (
                            suppliers.map((item) => {
                                return (
                                    <TableRow
                                        key={item.company.id}
                                        item={item}
                                        onView={() => setViewingCompany(item)}
                                        onAuthorize={() => setAuthorizingCompany(item)}
                                    />
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    Nenhum fornecedor encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className='mt-4'>
                    <Pagination
                        page={page}
                        total={pagination.total}
                        limit={limit}
                        onPageChange={handlePageChange}
                        className="rounded-b-xl border-t-0 rounded-t-none"
                    />
                </div>
            )}

            {/* Modals */}
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

function TableRow({ item, onView, onAuthorize }: {
    item: CompanyWithResponsible,
    onView: () => void,
    onAuthorize: () => void
}) {
    const { company, responsible } = item;

    return (
        <tr className={`hover:bg-gray-50 transition-colors ${company.status === CompanyStatus.PENDING ? 'bg-orange-50/30' : ''}`}>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{company.fantasyName}</div>
                        <div className="text-xs text-gray-500">{company.cnpj}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-gray-600">
                    <UserIcon size={14} className="text-gray-400" />
                    {responsible ? responsible.name : '-'}
                </div>
            </td>
            <td className="px-6 py-4">
                <Badge status={company.status} context="company" />
            </td>
            <td className="px-6 py-4 text-center">
                <button
                    onClick={onView}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                >
                    <FileText size={16} />
                    Detalhes
                </button>
            </td>
            <td className="px-6 py-4 text-center">
                <button
                    onClick={onAuthorize}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                    title="Gerenciar Acesso"
                >
                    <ShieldCheck size={16} />
                    Gerenciar
                </button>
            </td>
        </tr>
    );
}