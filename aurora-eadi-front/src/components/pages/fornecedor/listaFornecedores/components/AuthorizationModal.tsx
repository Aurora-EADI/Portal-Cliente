
import React, { useState } from 'react';
import { CompanyWithResponsible } from '@/services/api';
import { CompanyStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Check, X, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';

interface AuthorizationModalProps {
    companyData: CompanyWithResponsible;
    onClose: () => void;
    onAuthorize: (status: CompanyStatus) => Promise<void>;
    isUpdating: boolean;
}

export function AuthorizationModal({ companyData, onClose, onAuthorize, isUpdating }: AuthorizationModalProps) {
    const [isRejecting, setIsRejecting] = useState(false);

    const handleApprove = () => {
        onAuthorize(CompanyStatus.ACTIVE);
    };

    const handleRejectClick = () => {
        setIsRejecting(true);
    };

    const handleConfirmReject = () => {
        onAuthorize(CompanyStatus.REJECTED);
    };

    const handleCancel = () => {
        if (isRejecting) setIsRejecting(false);
        else onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Gerenciar Acesso</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6 flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg">
                            {companyData.company.fantasyName.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">{companyData.company.fantasyName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">CNPJ: {companyData.company.cnpj}</span>
                                <Badge status={companyData.company.status} context="company" />
                            </div>
                        </div>
                    </div>

                    {!isRejecting ? (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 mb-4">
                                Selecione uma ação para o cadastro deste fornecedor.
                            </p>

                            {companyData.company.status !== CompanyStatus.ACTIVE && (
                                <button
                                    onClick={handleApprove}
                                    disabled={isUpdating}
                                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                    Autorizar Acesso
                                </button>
                            )}

                            {companyData.company.status !== CompanyStatus.REJECTED && (
                                <button
                                    onClick={handleRejectClick}
                                    disabled={isUpdating}
                                    className="w-full py-3 px-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <X size={20} />
                                    Bloquear / Rejeitar
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-start gap-3 p-4 bg-red-50 text-red-800 rounded-lg mb-6">
                                <AlertCircle className="shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold">Confirmar Bloqueio</h4>
                                    <p className="text-sm mt-1">
                                        Tem certeza que deseja bloquear o acesso deste fornecedor? Ele não poderá mais acessar o sistema.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsRejecting(false)}
                                    disabled={isUpdating}
                                    className="flex-1 py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmReject}
                                    disabled={isUpdating}
                                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
