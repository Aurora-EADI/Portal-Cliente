import React, { useState, useEffect } from 'react';
import { 
    Service, 
    ServiceCalculationType, 
    ServiceModal, 
    UpdateServiceDto 
} from '@/types';
import { 
    useUpdateService, 
    useCreateServiceCost, 
    useServiceCostCurrent 
} from '@/hooks/useServices';
import { 
    X, Wrench, Save, Loader2,
    Calculator, Plane, Ship, Globe 
} from 'lucide-react';
import { toast } from 'sonner';

interface EditServiceModalProps {
    service: Service;
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

export function EditServiceModal({ service, onClose }: EditServiceModalProps) {
    const { mutateAsync: updateService, isPending: isUpdatingService } = useUpdateService();

    const [formData, setFormData] = useState({
        name: service.name,
        description: service.description || '',
        calculationType: service.calculationType,
        modal: service.modal,
        hasStripping: service.hasStripping,
        hasLcl: service.hasLcl || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // 1. Update service info if changed
            const serviceChanges: UpdateServiceDto = {};
            if (formData.name !== service.name) serviceChanges.name = formData.name;
            if (formData.description !== service.description) serviceChanges.description = formData.description;
            if (formData.calculationType !== service.calculationType) serviceChanges.calculationType = formData.calculationType;
            if (formData.modal !== service.modal) serviceChanges.modal = formData.modal;
            if (formData.hasStripping !== service.hasStripping) serviceChanges.hasStripping = formData.hasStripping;
            if ((formData.hasLcl || false) !== (service.hasLcl || false)) serviceChanges.hasLcl = formData.hasLcl;

            if (Object.keys(serviceChanges).length > 0) {
                await updateService({ id: service.id, data: serviceChanges });
            }

            onClose();
        } catch (error) {
            console.error('Erro ao atualizar serviço:', error);
        }
    };

    const isPending = isUpdatingService;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Wrench size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Editar Serviço</h3>
                            <p className="text-sm text-gray-500">{service.code}</p>
                        </div>

                        <div className="hidden">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasLcl"
                                    checked={formData.hasLcl}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">Somente para Carga Solta (LCL)</span>
                                    <span className="text-xs text-gray-500">Este serviço só aparecerá se a simulação tiver carga solta (LCL) marcada</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>

                        {/* Modalidade */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                            <select
                                name="modal"
                                value={formData.modal}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value={ServiceModal.AIR}>✈️ Aéreo</option>
                                <option value={ServiceModal.MARITIME}>🚢 Marítimo</option>
                                <option value={ServiceModal.BOTH}>🌍 Ambos</option>
                            </select>
                        </div>

                        {/* Tipo de Cálculo */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cálculo</label>
                            <select
                                name="calculationType"
                                value={formData.calculationType}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                {Object.entries(calculationTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Descrição */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                            />
                        </div>

                        {/* Checkbox Desova */}
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasStripping"
                                    checked={formData.hasStripping}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">Somente para Desova</span>
                                    <span className="text-xs text-gray-500">Este serviço só aparecerá se a simulação tiver desova marcada</span>
                                </div>
                            </label>
                        </div>

                        {/* Checkbox LCL */}
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasLcl"
                                    checked={formData.hasLcl}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">Somente para Carga Solta (LCL)</span>
                                    <span className="text-xs text-gray-500">Este serviço só aparecerá se a simulação tiver carga solta (LCL) marcada</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                    >
                        {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}
