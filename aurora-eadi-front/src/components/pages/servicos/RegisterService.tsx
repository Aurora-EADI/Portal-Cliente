"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateService, useCreateServiceCost } from '@/hooks/useServices';
import { CreateServiceDto, ServiceCalculationType, ServiceModal } from '@/types';
import { Loader2, ArrowLeft, Save, Plane, Ship, Globe } from 'lucide-react';
import Link from 'next/link';

const calculationTypeLabels: Record<ServiceCalculationType, string> = {
    [ServiceCalculationType.FIXED]: 'Valor Fixo (R$)',
    [ServiceCalculationType.PERCENTAGE_CIF]: 'Percentual sobre CIF (%)',
    [ServiceCalculationType.PER_CONTAINER]: 'Valor por Container (R$)',
    [ServiceCalculationType.PER_TONNE]: 'Ton ou M³ (R$)',
    [ServiceCalculationType.PER_KG]: 'Por Quilo (R$)',
};

// type ServiceModal = 'AIR' | 'MARITIME' | 'BOTH'; // Removido por conflito com enum importado

const modalLabels: Record<ServiceModal, { label: string; icon: React.ReactNode; color: string }> = {
    AIR: { 
        label: 'Aéreo', 
        icon: <Plane size={16} />,
        color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    MARITIME: { 
        label: 'Marítimo', 
        icon: <Ship size={16} />,
        color: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    BOTH: { 
        label: 'Ambos', 
        icon: <Globe size={16} />,
        color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
};

interface FormData {
    name: string;
    description: string;
    calculationType: ServiceCalculationType;
    modal: ServiceModal; // ⚠️ NOVO CAMPO
    isActive: boolean;
    initialCost: string;
    hasStripping: boolean;
}

export function RegisterService() {
    const router = useRouter();
    const { mutateAsync: createService, isPending: isCreatingService } = useCreateService();
    const { mutateAsync: createServiceCost, isPending: isCreatingCost } = useCreateServiceCost();

    const isPending = isCreatingService || isCreatingCost;

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        calculationType: ServiceCalculationType.FIXED,
        modal: ServiceModal.AIR, // ⚠️ PADRÃO AÉREO
        isActive: true,
        initialCost: '',
        hasStripping: false,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'O nome é obrigatório';
        } else if (formData.name.length < 3) {
            newErrors.name = 'O nome deve ter pelo menos 3 caracteres';
        }

        if (!formData.calculationType) {
            newErrors.calculationType = 'O tipo de cálculo é obrigatório';
        }

        if (!formData.modal) {
            newErrors.modal = 'O modal é obrigatório';
        }

        if (!formData.initialCost.trim()) {
            newErrors.initialCost = 'O valor TX/VALOR é obrigatório';
        } else {
            const costValue = parseFloat(formData.initialCost.replace(',', '.'));
            if (isNaN(costValue) || costValue < 0) {
                newErrors.initialCost = 'Informe um valor válido';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const code = formData.name
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z0-9]/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 20);

            const serviceData: CreateServiceDto = {
                code,
                name: formData.name,
                description: formData.description || undefined,
                calculationType: formData.calculationType,
                modal: formData.modal, // ⚠️ INCLUIR MODAL
                isActive: formData.isActive,
                hasStripping: formData.hasStripping,
            };

            const newService = await createService(serviceData);

            const costValue = parseFloat(formData.initialCost.replace(',', '.'));
            await createServiceCost({
                serviceId: newService.id,
                cost: costValue,
                reason: 'Valor inicial do serviço',
            });

            router.push('/servicos');
        } catch (error) {
            console.error('Erro ao criar serviço:', error);
        }
    };

    const getCostLabel = () => {
        switch (formData.calculationType) {
            case ServiceCalculationType.PERCENTAGE_CIF:
                return 'TX / VALOR (%)';
            case ServiceCalculationType.PER_CONTAINER:
                return 'TX / VALOR (R$ por container)';
            case ServiceCalculationType.PER_TONNE:
                return 'TX / VALOR (R$ por tonelada)';
            default:
                return 'TX / VALOR (R$)';
        }
    };

    const getCostPlaceholder = () => {
        switch (formData.calculationType) {
            case ServiceCalculationType.PERCENTAGE_CIF:
                return 'Ex: 0.35';
            case ServiceCalculationType.PER_CONTAINER:
                return 'Ex: 350.00';
            case ServiceCalculationType.PER_TONNE:
                return 'Ex: 25.00';
            default:
                return 'Ex: 500.00';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link
                    href="/servicos"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Cadastrar Serviço</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Preencha os dados para cadastrar um novo serviço.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome */}
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Nome do Serviço <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Ex: Armazenagem, Desembaraço Aduaneiro"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        {/* ⚠️ NOVO CAMPO: Modal */}
                        <div>
                            <label htmlFor="modal" className="block text-sm font-medium text-gray-700 mb-1">
                                Modalidade <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="modal"
                                name="modal"
                                value={formData.modal}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.modal ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value={ServiceModal.AIR}>✈️ Aéreo</option>
                                <option value={ServiceModal.MARITIME}>🚢 Marítimo</option>
                                <option value={ServiceModal.BOTH}>🌍 Ambos (Aéreo + Marítimo)</option>
                            </select>
                            {errors.modal && (
                                <p className="mt-1 text-sm text-red-500">{errors.modal}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Define em quais simuladores este serviço aparecerá
                            </p>
                        </div>

                        {/* Tipo de Cálculo */}
                        <div>
                            <label htmlFor="calculationType" className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Cálculo <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="calculationType"
                                name="calculationType"
                                value={formData.calculationType}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.calculationType ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                {Object.entries(calculationTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {errors.calculationType && (
                                <p className="mt-1 text-sm text-red-500">{errors.calculationType}</p>
                            )}
                        </div>

                        {/* TX / VALOR */}
                        <div className="md:col-span-2">
                            <label htmlFor="initialCost" className="block text-sm font-medium text-gray-700 mb-1">
                                {getCostLabel()} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="initialCost"
                                name="initialCost"
                                value={formData.initialCost}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.initialCost ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder={getCostPlaceholder()}
                            />
                            {errors.initialCost && (
                                <p className="mt-1 text-sm text-red-500">{errors.initialCost}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Valor padrão usado nas simulações
                            </p>
                        </div>

                        {/* Descrição */}
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Descrição
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                placeholder="Descrição detalhada do serviço..."
                            />
                        </div>

                        {/* Checkboxes */}
                        <div className="md:col-span-2 flex flex-col gap-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">
                                        Serviço ativo
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Serviços inativos não aparecem nas simulações
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasStripping"
                                    checked={formData.hasStripping}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">
                                        Desova?
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Se marcado, este serviço só aparecerá em simulações que tenham desova
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Link
                            href="/servicos"
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Salvar Serviço
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}