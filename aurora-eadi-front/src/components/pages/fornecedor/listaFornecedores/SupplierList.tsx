
import React, { useState } from 'react';
import { useSuppliers, useUpdateCompanyStatus } from "@/hooks/useSuppliers";
import { CompanyWithResponsible } from '@/services/api';
import { CompanyStatus } from '@/types';
import { Badge } from "@/components/ui/Badge";
import { Loader2, Eye, ShieldCheck, Building2, User as UserIcon, FileText } from "lucide-react";
import { CompanyDetailsModal } from './components/CompanyDetailsModal';
import { AuthorizationModal } from './components/AuthorizationModal';

export function SupplierList() {
    const { data: suppliers, isLoading, isError } = useSuppliers();
    const { mutateAsync: updateCompany, isPending: isUpdating } = useUpdateCompanyStatus();

    const [viewingCompany, setViewingCompany] = useState<CompanyWithResponsible | null>(null);
    const [authorizingCompany, setAuthorizingCompany] = useState<CompanyWithResponsible | null>(null);

    const handleAuthorization = async (status: CompanyStatus) => {
        if (!authorizingCompany) return;
        try {
            await updateCompany({ id: String(authorizingCompany.company.id), status });
            setAuthorizingCompany(null);
        } catch (error) {
            console.error("Failed to update status", error);
            // Error handling usually done in hook or global toaster
        }
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
                <div className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                    Total: {suppliers?.length || 0}
                </div>
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
                                const { company, responsible } = item;
                                return (
                                    <TableRow
                                        key={company.id}
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

// Separated TableRow for cleaner code (optional)
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
                    Documentos
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
