import React, { useState } from 'react';
import { useCustomers, useUpdateCustomerStatus } from "@/hooks/useCustomers";
import { Customer, CustomerStatus } from '@/types';
import { Badge } from "@/components/ui/Badge";
import { Loader2, Building2, User as UserIcon, FileText, Search, CheckCircle, XCircle, Plus } from "lucide-react";
import { formatNumber, formatDocument } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CustomerDetailsModal } from './components/CustomerDetailsModal';
import Link from 'next/link';

const STATUS_CARDS = [
    {
        status: CustomerStatus.ACTIVE,
        label: 'Ativo',
        icon: CheckCircle,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
    },
    {
        status: CustomerStatus.INACTIVE,
        label: 'Inativo',
        icon: XCircle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
    },
];

export function CustomerList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const limit = 10;

    const { data, isLoading, isError } = useCustomers({
        page,
        limit,
        search,
        status: statusFilter || undefined
    });
    const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateCustomerStatus();

    const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

    const customers = data?.data || [];
    const pagination = data?.pagination;
    const statusCounts = data?.statusCounts || {};

    const handleStatusToggle = async (customer: Customer) => {
        const newStatus = customer.status === CustomerStatus.ACTIVE
            ? CustomerStatus.INACTIVE
            : CustomerStatus.ACTIVE;

        try {
            await updateStatus({ id: customer.id, status: newStatus });
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
                Erro ao carregar clientes.
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Lista de Clientes</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie os clientes cadastrados.
                    </p>
                </div>
                <Link
                    href="/cliente/cadastro"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                    <Plus size={20} />
                    Novo Cliente
                </Link>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Search */}
            <div className="space-y-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por código, nome ou documento"
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
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Código</th>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Documento</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers && customers.length > 0 ? (
                            customers.map((customer) => (
                                <TableRow
                                    key={customer.id}
                                    customer={customer}
                                    onView={() => setViewingCustomer(customer)}
                                    onToggleStatus={() => handleStatusToggle(customer)}
                                    isUpdating={isUpdating}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    Nenhum cliente encontrado.
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

            {/* Modal */}
            {viewingCustomer && (
                <CustomerDetailsModal
                    customer={viewingCustomer}
                    onClose={() => setViewingCustomer(null)}
                />
            )}
        </div>
    );
}

function TableRow({ customer, onView, onToggleStatus, isUpdating }: {
    customer: Customer,
    onView: () => void,
    onToggleStatus: () => void,
    isUpdating: boolean
}) {
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                    </div>
                    <div className="font-medium text-gray-900">{customer.code}</div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-gray-600">
                    <UserIcon size={14} className="text-gray-400" />
                    {customer.name}
                </div>
            </td>
            <td className="px-6 py-4 text-gray-600">
                {formatDocument(customer.document)}
            </td>
            <td className="px-6 py-4">
                <Badge status={customer.status} context="customer" />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={onView}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                    >
                        <FileText size={16} />
                        Detalhes
                    </button>
                    <button
                        onClick={onToggleStatus}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                            customer.status === CustomerStatus.ACTIVE
                                ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 border border-green-200 text-green-600 hover:bg-green-100'
                        }`}
                    >
                        {customer.status === CustomerStatus.ACTIVE ? (
                            <>
                                <XCircle size={16} />
                                Desativar
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                Ativar
                            </>
                        )}
                    </button>
                </div>
            </td>
        </tr>
    );
}
