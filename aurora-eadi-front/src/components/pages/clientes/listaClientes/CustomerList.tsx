import React, { useState } from 'react';
import { useCustomers, useUpdateCustomerStatus, useCreateCustomer } from "@/hooks/useCustomers";
import { Customer, CustomerStatus, CreateCustomerDTO } from '@/types';
import { Badge } from "@/components/ui/Badge";
import { Loader2, Building2, User as UserIcon, FileText, Search, CheckCircle, XCircle, Plus, Save, ArrowLeft } from "lucide-react";
import { formatNumber } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CustomerDetailsModal } from './components/CustomerDetailsModal';
import { toast } from 'sonner';

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

    // Mutation for creating customer
    const { mutateAsync: createCustomer, isPending: isSaving } = useCreateCustomer();

    // Inline Form States
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<CreateCustomerDTO>({
        code: '',
        name: '',
        corporateName: '',
        contact: '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        document: '',
    });
    const [errors, setErrors] = useState<Partial<CreateCustomerDTO>>({});

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

    // Form Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-generate code when name changes
            if (name === 'name' && value) {
                const names = value.split(' ');
                if (names.length > 0) {
                    const firstName = names[0].toUpperCase();
                    // Simple logic: First Name + -001 (In a real scenario, this might need to check for uniqueness or simply suggest)
                    newData.code = `${firstName}-001`;
                }
            }

            return newData;
        });

        if (errors[name as keyof CreateCustomerDTO]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CreateCustomerDTO> = {};
        if (!formData.code.trim()) newErrors.code = 'O código é obrigatório';
        if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório';
        if (!formData.document.trim()) newErrors.document = 'O documento é obrigatório';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await createCustomer(formData);
            toast.success('Cliente cadastrado com sucesso!');

            // Reset form and close
            setFormData({
                code: '',
                name: '',
                corporateName: '',
                contact: '',
                zipCode: '',
                street: '',
                number: '',
                complement: '',
                neighborhood: '',
                city: '',
                state: '',
                document: ''
            });
            setIsAdding(false);
            setPage(1); // Go to first page to see new item
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            toast.error('Erro ao cadastrar cliente. Verifique os dados.');
        }
    };

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
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white shadow-sm ${isAdding
                        ? 'bg-gray-500 hover:bg-gray-600'
                        : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                >
                    {isAdding ? (
                        <>Cancelar</>
                    ) : (
                        <>
                            <Plus size={20} />
                            Novo Cliente
                        </>
                    )}
                </button>
            </div>

            {/* Inline Add Form */}
            {isAdding && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-in slide-in-from-top duration-300 mb-6">
                    <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                        <div className="bg-primary-100 p-2 rounded-full mr-3">
                            <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">
                            Cadastrar Novo Cliente
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Nome */}
                            <div className="md:col-span-1">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome Fantasia <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 transition-all ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
                                        }`}
                                    placeholder="Ex: Moto Honda"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500 font-medium">{errors.name}</p>
                                )}
                            </div>

                            {/* Razão Social */}
                            <div className="md:col-span-1">
                                <label htmlFor="corporateName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Razão Social
                                </label>
                                <input
                                    type="text"
                                    id="corporateName"
                                    name="corporateName"
                                    value={formData.corporateName || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="Razão Social Ltda"
                                />
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
                                    disabled={isSaving}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 transition-all ${errors.document ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
                                        }`}
                                    placeholder="Ex: 00.000.000/0000-00"
                                />
                                {errors.document && (
                                    <p className="mt-1 text-sm text-red-500 font-medium">{errors.document}</p>
                                )}
                            </div>

                            {/* Contato */}
                            <div>
                                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contato
                                </label>
                                <input
                                    type="text"
                                    id="contact"
                                    name="contact"
                                    value={formData.contact || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="Nome do contato"
                                />
                            </div>

                            {/* Endereço - CEP */}
                            <div>
                                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                                    CEP
                                </label>
                                <input
                                    type="text"
                                    id="zipCode"
                                    name="zipCode"
                                    value={formData.zipCode || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="00000-000"
                                />
                            </div>

                            {/* Endereço - Rua */}
                            <div className="md:col-span-2">
                                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                                    Rua / Logradouro
                                </label>
                                <input
                                    type="text"
                                    id="street"
                                    name="street"
                                    value={formData.street || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="Rua Exemplo"
                                />
                            </div>

                            {/* Endereço - Número */}
                            <div>
                                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                                    Número
                                </label>
                                <input
                                    type="text"
                                    id="number"
                                    name="number"
                                    value={formData.number || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="123"
                                />
                            </div>

                            {/* Endereço - Complemento */}
                            <div>
                                <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1">
                                    Complemento
                                </label>
                                <input
                                    type="text"
                                    id="complement"
                                    name="complement"
                                    value={formData.complement || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="Sala 1, Bloco A"
                                />
                            </div>

                            {/* Endereço - Bairro */}
                            <div>
                                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
                                    Bairro
                                </label>
                                <input
                                    type="text"
                                    id="neighborhood"
                                    name="neighborhood"
                                    value={formData.neighborhood || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="Centro"
                                />
                            </div>

                            {/* Endereço - Cidade */}
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="São Paulo"
                                />
                            </div>

                            {/* Endereço - UF */}
                            <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                    UF
                                </label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.state || ''}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                    placeholder="SP"
                                    maxLength={2}
                                />
                            </div>

                            {/* Código (Automático) */}
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                                    Código <span className="text-red-500">*</span> <span className="text-xs text-gray-400 font-normal ml-1">(Automático)</span>
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    disabled={isSaving} // Pode deixar editável se quiser, mas o requisito diz 'automatize'
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 transition-all ${errors.code ? 'border-red-500 focus:ring-red-200' : 'border-gray-200'
                                        }`}
                                    placeholder="Gerado automaticamente..."
                                />
                                {errors.code && (
                                    <p className="mt-1 text-sm text-red-500 font-medium">{errors.code}</p>
                                )}
                            </div>

                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-lg font-medium disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Salvar Cliente
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
                {customer.document}
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
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${customer.status === CustomerStatus.ACTIVE
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
