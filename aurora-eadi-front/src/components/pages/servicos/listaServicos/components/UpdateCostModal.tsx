import React, { useState, useEffect } from 'react';
import { Service, ServiceCalculationType, ServiceCost } from '@/types';
import { useCreateServiceCost, useServiceCostsHistory } from '@/hooks/useServices';
import { 
    X, DollarSign, Save, Loader2, Info, 
    History, ArrowRight, User, Calendar, MessageSquare 
} from 'lucide-react';
import { toast } from 'sonner';

interface UpdateCostModalProps {
    service: Service;
    currentCost?: number;
    isOpen: boolean;
    onClose: () => void;
}

const calculationTypeLabels: Record<ServiceCalculationType, string> = {
    [ServiceCalculationType.FIXED]: 'Valor Fixo (R$)',
    [ServiceCalculationType.PERCENTAGE_CIF]: 'Percentual sobre CIF (%)',
    [ServiceCalculationType.PER_CONTAINER]: 'Valor por Container (R$)',
    [ServiceCalculationType.PER_TONNE]: 'Ton ou M³ (R$)',
    [ServiceCalculationType.PER_KG]: 'Por Quilo (R$)',
};

export function UpdateCostModal({ service, currentCost, onClose }: UpdateCostModalProps) {
    const { data: history = [], isLoading: isLoadingHistory } = useServiceCostsHistory(service.id);
    const { mutateAsync: createServiceCost, isPending: isSaving } = useCreateServiceCost();

    const [newCost, setNewCost] = useState(currentCost?.toString() || '');
    const [reason, setReason] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const costValue = parseFloat(newCost.replace(',', '.'));
        if (isNaN(costValue)) {
            toast.error('Informe um valor válido');
            return;
        }

        if (costValue === currentCost) {
            toast.info('O novo valor é igual ao atual');
            return;
        }

        if (!reason.trim()) {
            toast.error('Informe o motivo da alteração');
            return;
        }

        try {
            await createServiceCost({
                serviceId: service.id,
                cost: costValue,
                reason: reason.trim(),
            });
            onClose();
        } catch (error) {
            console.error('Erro ao atualizar custo:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Atualizar Valor do Serviço</h3>
                            <p className="text-sm text-gray-500">{service.name} ({service.code})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Alteração */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Valor Atual</label>
                                <div className="text-2xl font-bold text-gray-400">
                                    {currentCost !== undefined ? (
                                        service.calculationType === ServiceCalculationType.PERCENTAGE_CIF ? `${currentCost}%` : 
                                        `R$ ${currentCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                    ) : '-'}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">{calculationTypeLabels[service.calculationType]}</p>
                            </div>

                            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                                <label className="block text-xs font-semibold text-primary-600 uppercase mb-2">Novo Valor</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newCost}
                                        onChange={(e) => setNewCost(e.target.value)}
                                        className="w-full bg-white border border-primary-200 rounded-lg py-2 px-3 text-xl font-bold text-primary-900 focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="0,00"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-[10px] text-primary-600 mt-1">Informe a nova taxa ou valor base</p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <MessageSquare size={16} className="text-gray-400" />
                                    Motivo da Alteração <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ex: Reajuste contratual, Atualização de tabela, etc."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none h-20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-sm disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Confirmar Novo Valor
                            </button>
                        </div>
                    </form>

                    {/* Histórico */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-900 border-b border-gray-100 pb-2">
                            <History size={18} className="text-gray-400" />
                            <h4 className="font-semibold">Histórico de Alterações</h4>
                        </div>

                        {isLoadingHistory ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : history.length <= 1 ? (
                            <p className="text-sm text-gray-500 text-center py-4 italic">Nenhuma alteração anterior registrada.</p>
                        ) : (
                            <div className="space-y-3">
                                {history.slice(1, 6).map((item: any, idx) => (
                                    <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                                            {history.length - idx - 1}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">
                                                        {service.calculationType === ServiceCalculationType.PERCENTAGE_CIF ? `${item.cost}%` : 
                                                        `R$ ${parseFloat(item.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                                    </span>
                                                    <ArrowRight size={12} className="text-gray-300" />
                                                    <span className="text-xs text-gray-500 italic">válido em {formatDate(item.validFrom)}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">{item.reason}</p>
                                            <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400">
                                                <span className="flex items-center gap-1"><User size={10} /> {item.user?.name || 'Sistema'}</span>
                                                <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(item.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-start gap-2 text-[11px] text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <p>
                            Ao confirmar, o valor antigo será expirado e o novo valor passará a ser usado em todas as <strong>novas simulações</strong>. 
                            Simulações já aprovadas ou enviadas não serão afetadas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
