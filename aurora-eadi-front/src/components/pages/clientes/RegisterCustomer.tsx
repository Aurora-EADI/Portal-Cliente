"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { CreateCustomerDTO } from '@/types';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export function RegisterCustomer() {
    const router = useRouter();
    const { mutateAsync: createCustomer, isPending } = useCreateCustomer();

    const [formData, setFormData] = useState<CreateCustomerDTO>({
        code: '',
        name: '',
        document: '',
    });

    const [errors, setErrors] = useState<Partial<CreateCustomerDTO>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpar erro do campo quando o usuário começar a digitar
        if (errors[name as keyof CreateCustomerDTO]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CreateCustomerDTO> = {};

        if (!formData.code.trim()) {
            newErrors.code = 'O código é obrigatório';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'O nome é obrigatório';
        }

        if (!formData.document.trim()) {
            newErrors.document = 'O documento é obrigatório';
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
            await createCustomer(formData);
            router.push('/cliente');
        } catch (error) {
            // Erro já tratado pelo hook
            console.error('Erro ao criar cliente:', error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link
                    href="/cliente"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Cadastrar Cliente</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Preencha os dados para cadastrar um novo cliente.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Código */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                                Código <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.code ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Ex: CLI001"
                            />
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-500">{errors.code}</p>
                            )}
                        </div>

                        {/* Documento */}
                        <div>
                            <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                                CNPJ/CPF <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="document"
                                name="document"
                                value={formData.document}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.document ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Ex: 00.000.000/0000-00"
                            />
                            {errors.document && (
                                <p className="mt-1 text-sm text-red-500">{errors.document}</p>
                            )}
                        </div>

                        {/* Nome */}
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Nome <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nome do cliente"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Link
                            href="/cliente"
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
                                    Salvar Cliente
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
