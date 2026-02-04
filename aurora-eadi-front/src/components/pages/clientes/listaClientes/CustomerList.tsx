import React, { useState } from 'react';
import { useCustomers, useUpdateCustomerStatus, useCreateCustomer } from "@/hooks/useCustomers";
import { Customer, CustomerStatus, CreateCustomerDTO } from '@/types';
import { Badge } from "@/components/ui/Badge";
import { Building2, User as UserIcon, FileText, CheckCircle, XCircle, Plus, Save, Loader2 } from "lucide-react";
import { CustomerDetailsModal } from './components/CustomerDetailsModal';
import { toast } from 'sonner';
import {
    DataTable,
    Column,
    SearchBar,
    StatusCards,
    StatusCardConfig,
    PageHeader,
} from '@/components/ui/DataTable';

const STATUS_CARDS: StatusCardConfig[] = [
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
    const [statusFilter, setStatusFilter] = useState<string>('');
    const limit = 10;

    const { mutateAsync: createCustomer, isPending: isSaving } = useCreateCustomer();

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'name' && value) {
                const names = value.split(' ');
                if (names.length > 0) {
                    const firstName = names[0].toUpperCase();
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
        if (!formData.code.trim()) newErrors.code = 'O codigo e obrigatorio';
        if (!formData.name.trim()) newErrors.name = 'O nome e obrigatorio';
        if (!formData.document.trim()) newErrors.document = 'O documento e obrigatorio';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await createCustomer(formData);
            toast.success('Cliente cadastrado com sucesso!');
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
            setPage(1);
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

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleClear = () => {
        setStatusFilter('');
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

    const columns: Column<Customer>[] = [
        {
            key: 'codigo',
            header: 'Codigo',
            render: (customer) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                    </div>
                    <div className="font-medium text-gray-900">{customer.code}</div>
                </div>
            ),
        },
        {
            key: 'nome',
            header: 'Nome',
            render: (customer) => (
                <div className="flex items-center gap-2 text-gray-600">
                    <UserIcon size={14} className="text-gray-400" />
                    {customer.name}
                </div>
            ),
        },
        {
            key: 'documento',
            header: 'Documento',
            render: (customer) => (
                <span className="text-gray-600">{customer.document}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (customer) => <Badge status={customer.status} context="customer" />,
        },
        {
            key: 'acoes',
            header: 'Acoes',
            align: 'center',
            render: (customer) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setViewingCustomer(customer)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                    >
                        <FileText size={16} />
                        Detalhes
                    </button>
                    <button
                        onClick={() => handleStatusToggle(customer)}
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
            ),
        },
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <PageHeader
                title="Lista de Clientes"
                description="Gerencie os clientes cadastrados."
                actions={
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
                }
            />

            {isAdding && (
                <InlineAddForm
                    formData={formData}
                    errors={errors}
                    isSaving={isSaving}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                />
            )}

            <StatusCards
                cards={STATUS_CARDS}
                statusCounts={statusCounts}
                activeStatus={statusFilter}
                onStatusClick={handleStatusCardClick}
                columns={2}
            />

            <div className="space-y-3">
                <SearchBar
                    placeholder="Buscar por codigo, nome ou documento"
                    onSearch={handleSearch}
                    onClear={handleClear}
                    showClearButton={!!(search || statusFilter)}
                />
            </div>

            <DataTable
                columns={columns}
                data={customers}
                keyExtractor={(customer) => customer.id}
                isLoading={isLoading}
                isError={isError}
                errorMessage="Erro ao carregar clientes."
                emptyMessage="Nenhum cliente encontrado."
                pagination={pagination ? {
                    page,
                    total: pagination.total,
                    limit,
                    onPageChange: handlePageChange,
                } : undefined}
            />

            {viewingCustomer && (
                <CustomerDetailsModal
                    customer={viewingCustomer}
                    onClose={() => setViewingCustomer(null)}
                />
            )}
        </div>
    );
}

interface InlineAddFormProps {
    formData: CreateCustomerDTO;
    errors: Partial<CreateCustomerDTO>;
    isSaving: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
}

function InlineAddForm({ formData, errors, isSaving, onChange, onSubmit }: InlineAddFormProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-in slide-in-from-top duration-300 mb-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                <div className="bg-primary-100 p-2 rounded-full mr-3">
                    <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                    Cadastrar Novo Cliente
                </h3>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                        id="name"
                        name="name"
                        label="Nome Fantasia"
                        required
                        value={formData.name}
                        onChange={onChange}
                        disabled={isSaving}
                        error={errors.name}
                        placeholder="Ex: Moto Honda"
                    />

                    <FormField
                        id="corporateName"
                        name="corporateName"
                        label="Razao Social"
                        value={formData.corporateName || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="Razao Social Ltda"
                    />

                    <FormField
                        id="document"
                        name="document"
                        label="CNPJ/CPF"
                        required
                        value={formData.document}
                        onChange={onChange}
                        disabled={isSaving}
                        error={errors.document}
                        placeholder="Ex: 00.000.000/0000-00"
                    />

                    <FormField
                        id="contact"
                        name="contact"
                        label="Contato"
                        value={formData.contact || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="Nome do contato"
                    />

                    <FormField
                        id="zipCode"
                        name="zipCode"
                        label="CEP"
                        value={formData.zipCode || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="00000-000"
                    />

                    <FormField
                        id="street"
                        name="street"
                        label="Rua / Logradouro"
                        value={formData.street || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="Rua Exemplo"
                        className="md:col-span-2"
                    />

                    <FormField
                        id="number"
                        name="number"
                        label="Numero"
                        value={formData.number || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="123"
                    />

                    <FormField
                        id="complement"
                        name="complement"
                        label="Complemento"
                        value={formData.complement || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="Sala 1, Bloco A"
                    />

                    <FormField
                        id="neighborhood"
                        name="neighborhood"
                        label="Bairro"
                        value={formData.neighborhood || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="Centro"
                    />

                    <FormField
                        id="city"
                        name="city"
                        label="Cidade"
                        value={formData.city || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="Sao Paulo"
                    />

                    <FormField
                        id="state"
                        name="state"
                        label="UF"
                        value={formData.state || ''}
                        onChange={onChange}
                        disabled={isSaving}
                        placeholder="SP"
                        maxLength={2}
                    />

                    <FormField
                        id="code"
                        name="code"
                        label="Codigo"
                        required
                        hint="(Automatico)"
                        value={formData.code}
                        onChange={onChange}
                        disabled={isSaving}
                        error={errors.code}
                        placeholder="Gerado automaticamente..."
                        className="bg-gray-50"
                    />
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
    );
}

interface FormFieldProps {
    id: string;
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    placeholder?: string;
    hint?: string;
    maxLength?: number;
    className?: string;
}

function FormField({
    id,
    name,
    label,
    value,
    onChange,
    disabled,
    required,
    error,
    placeholder,
    hint,
    maxLength,
    className = '',
}: FormFieldProps) {
    return (
        <div className={className}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
                {hint && <span className="text-xs text-gray-400 font-normal ml-1">{hint}</span>}
            </label>
            <input
                type="text"
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                maxLength={maxLength}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 transition-all ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
                    }`}
                placeholder={placeholder}
            />
            {error && (
                <p className="mt-1 text-sm text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}
