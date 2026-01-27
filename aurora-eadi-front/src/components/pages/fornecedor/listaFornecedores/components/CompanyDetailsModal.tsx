
import React, { useState, useEffect } from 'react';
import { CompanyWithResponsible, documentTypeService, companyRequirementService } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Building2, X, ShieldCheck, Loader2 } from 'lucide-react';
import { formatCNPJ } from '@/lib/utils';
import { toast } from 'sonner';

interface CompanyDetailsModalProps {
    companyData: CompanyWithResponsible;
    onClose: () => void;
}

export function CompanyDetailsModal({ companyData, onClose }: CompanyDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'requirements'>('info');
    const [documentTypes, setDocumentTypes] = useState<{ id: number; name: string }[]>([]);
    const [companyRequirements, setCompanyRequirements] = useState<Set<number>>(new Set());
    const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);

    useEffect(() => {
        if (activeTab === 'requirements') {
            loadRequirements(String(companyData.company.id));
        }
    }, [activeTab, companyData.company.id]);

    const loadRequirements = async (companyId: string) => {
        try {
            setIsLoadingRequirements(true);
            const [types, reqs] = await Promise.all([
                documentTypeService.getAll(),
                companyRequirementService.getRequirements(companyId)
            ]);
            setDocumentTypes(types);
            setCompanyRequirements(new Set(reqs.filter(r => r.isRequired).map(r => r.documentTypeId)));
        } catch (error) {
            console.error('Erro ao carregar requisitos:', error);
            toast.error('Erro ao carregar requisitos.');
        } finally {
            setIsLoadingRequirements(false);
        }
    };

    const toggleRequirement = async (typeId: number) => {
        const isRequired = !companyRequirements.has(typeId);
        const newSet = new Set(companyRequirements);
        if (isRequired) newSet.add(typeId);
        else newSet.delete(typeId);

        setCompanyRequirements(newSet); // Optimistic update

        try {
            await companyRequirementService.updateRequirements(String(companyData.company.id), [{ documentTypeId: typeId, isRequired }]);
            toast.success('Requisito atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar requisito:', error);
            toast.error('Erro ao atualizar requisito.');
            // Revert on error
            loadRequirements(String(companyData.company.id));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 shadow-sm">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-900">{companyData.company.fantasyName}</h2>
                                <Badge status={companyData.company.status} context="company" />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Dados Cadastrais da Empresa</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>
                {/* Tabs */}
                <div className="px-6 border-b border-gray-100 flex gap-6">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Dados Cadastrais
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {activeTab === 'info' ? (
                        <>
                            {/* Identificação */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Identificação</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block">Razão Social</span>
                                        <span className="text-sm font-medium text-gray-900">{companyData.company.socialReason || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block">CNPJ</span>
                                        <span className="text-sm font-medium text-gray-900">{formatCNPJ(companyData.company.cnpj)}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Contato */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Contato</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block">Telefone</span>
                                        <span className="text-sm font-medium text-gray-900">{companyData.company.phone || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block">Responsável</span>
                                        <span className="text-sm font-medium text-gray-900">{companyData.responsible?.name || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                                        <span className="text-xs text-gray-500 block">Email Responsável</span>
                                        <span className="text-sm font-medium text-gray-900">{companyData.responsible?.email || '-'}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Endereço */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Endereço</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                                        <span className="text-xs text-gray-500 block">Logradouro</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {companyData.company.address}, {companyData.company.number}
                                            {companyData.company.complement && ` - ${companyData.company.complement}`}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block">Bairro</span>
                                        <span className="text-sm font-medium text-gray-900">{companyData.company.neighborhood || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block">CEP</span>
                                        <span className="text-sm font-medium text-gray-900">{companyData.company.zipCode || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block">Cidade</span>
                                        <span className="text-sm font-medium text-gray-900">{companyData.company.city || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block">Estado</span>
                                        <span className="text-sm font-medium text-gray-900">{companyData.company.state || '-'}</span>
                                    </div>
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
                                <p>Selecione os documentos que esta empresa <strong>deve</strong> enviar. O fornecedor será notificado sobre as pendências.</p>
                            </div>

                            {isLoadingRequirements ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" /></div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {documentTypes.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">Nenhum tipo de documento cadastrado no sistema.</div>
                                    ) : (
                                        documentTypes.map(type => (
                                            <label key={type.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300 mr-3"
                                                    checked={companyRequirements.has(type.id)}
                                                    onChange={() => toggleRequirement(type.id)}
                                                />
                                                <span className="font-medium text-gray-700">{type.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
