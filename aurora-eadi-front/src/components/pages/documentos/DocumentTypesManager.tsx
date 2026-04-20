"use client"
import React, { useState, useEffect, useRef } from 'react';
import { documentTypeService, requirementRulesService, SupplierTypeDto } from '../../../services/api';
import { DocumentType } from '../../../types';
import { Plus, Trash2, Edit2, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DocumentTypeScope,
    filterDocumentTypesByScope,
    getScopeToken,
    stripScopeToken,
} from '@/lib/documentTypeScope';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface DocumentTypesManagerProps {
    scope?: DocumentTypeScope;
}

export function DocumentTypesManager({ scope = 'COMPANY' }: DocumentTypesManagerProps) {
    const isWorkforceScope = scope === 'WORKFORCE';
    const defaultCategoryOptions = [
        'Jurídico',
        'Cadastral',
        'Tributário',
        'Fiscal',
        'Trabalhista',
        'Estadual',
        'Municipal',
        'Segurança',
        'SST',
    ];
    const companyClassificationOptions = ['MEI', 'ME', 'EPP', 'EIRELI'];
    const periodicityOptions = ['Sem periodicidade', 'Mensal', 'Trimestral', 'Semestral', 'Anual'];

    const [types, setTypes] = useState<DocumentType[]>([]);
    const [supplierTypes, setSupplierTypes] = useState<SupplierTypeDto[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<string[]>(
        [...defaultCategoryOptions].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    );
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryDraft, setCategoryDraft] = useState('');
    const [categoryTarget, setCategoryTarget] = useState<'new' | 'edit'>('new');
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const formSectionRef = useRef<HTMLDivElement | null>(null);
    const [newType, setNewType] = useState({
        name: '',
        description: '',
        periodicity: '',
        categories: [] as string[],
        companyClassifications: [] as string[],
        isSpecificDocument: false,
        supplierTypeIds: [] as string[],
        isOptionalDocument: false,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        periodicity: '',
        categories: [] as string[],
        companyClassifications: [] as string[],
        isSpecificDocument: false,
        supplierTypeIds: [] as string[],
        isOptionalDocument: false,
    });
    const sanitizeDescriptionDisplay = (value?: string) =>
        stripScopeToken((value || '')
            .replace(/\s*\|\s*Tipos de fornecedor IDs:[^|]*/gi, '')
            .replace(/\s*\|\s*Obrigatorio:\s*(Sim|Nao)/gi, '')
            .trim());
    const sortedSupplierTypes = [...supplierTypes].sort((a, b) => {
        const aIsOutros = a.name.trim().toLowerCase() === 'outros';
        const bIsOutros = b.name.trim().toLowerCase() === 'outros';
        if (aIsOutros && !bIsOutros) return 1;
        if (!aIsOutros && bIsOutros) return -1;
        return a.name.localeCompare(b.name, 'pt-BR');
    });

    useEffect(() => {
        loadTypes();
        loadSupplierTypes();
    }, [scope]);

    const loadTypes = async () => {
        try {
            setLoading(true);
            const data = await documentTypeService.getAll();
            setTypes(filterDocumentTypesByScope(data, scope));
        } catch (error) {
            console.error('Erro ao carregar tipos:', error);
            toast.error('Erro ao carregar lista de tipos de documentos.');
        } finally {
            setLoading(false);
        }
    };


    const openCategoryModal = (target: 'new' | 'edit') => {
        setCategoryTarget(target);
        setCategoryDraft('');
        setIsCategoryModalOpen(true);
    };

    const handleAddCategory = () => {
        const categoryName = categoryDraft.trim();
        if (!categoryName) return;

        const alreadyExists = categoryOptions.some(
            (item) => item.toLocaleLowerCase('pt-BR') === categoryName.toLocaleLowerCase('pt-BR')
        );
        if (alreadyExists) {
            toast.error('Essa categoria já existe.');
            return;
        }

        setCategoryOptions((current) =>
            [...current, categoryName].sort((a, b) => a.localeCompare(b, 'pt-BR'))
        );

        if (categoryTarget === 'edit') {
            setEditForm((current) => ({ ...current, categories: [...current.categories, categoryName] }));
        } else {
            setNewType((current) => ({ ...current, categories: [...current.categories, categoryName] }));
        }

        setIsCategoryModalOpen(false);
        setCategoryDraft('');
    };
    const resetNewType = () => {
        setNewType({
            name: '',
            description: '',
            periodicity: '',
            categories: [],
            companyClassifications: [],
            isSpecificDocument: false,
            supplierTypeIds: [],
            isOptionalDocument: false,
        });
    };

    const loadSupplierTypes = async () => {
        try {
            const data = await requirementRulesService.getSupplierTypes();
            setSupplierTypes(data.filter((item) => item.active));
        } catch (error) {
            console.error('Erro ao carregar tipos de fornecedor:', error);
            toast.error('Erro ao carregar tipos de fornecedor.');
        }
    };

    const handleCreate = async () => {
        if (!newType.name.trim()) {
            toast.error('Informe o nome do documento.');
            return;
        }
        if (!newType.periodicity) {
            toast.error('Selecione a periodicidade.');
            return;
        }
        if (newType.categories.length === 0) {
            toast.error('Selecione pelo menos uma categoria.');
            return;
        }
        if (newType.companyClassifications.length === 0) {
            toast.error('Selecione ao menos uma classificação empresarial.');
            return;
        }
        if (newType.isSpecificDocument && newType.supplierTypeIds.length === 0) {
            toast.error('Selecione ao menos um tipo de fornecedor para documento específico.');
            return;
        }

        try {
            const selectedSupplierTypes = supplierTypes
                .filter((item) => newType.supplierTypeIds.includes(item.id))
                .map((item) => item.name);

            const metadataLines = [
                getScopeToken(scope),
                ...(isWorkforceScope
                    ? [`Obrigatorio: ${newType.isOptionalDocument ? 'Nao' : 'Sim'}`]
                    : []),
                `Periodicidade: ${newType.periodicity}`,
                `Categorias: ${newType.categories.join(', ')}`,
                `Classificação Empresarial: ${newType.companyClassifications.join(', ')}`,
                `Documento específico: ${newType.isSpecificDocument ? 'Sim' : 'Não'}`,
                ...(newType.isSpecificDocument && selectedSupplierTypes.length > 0
                    ? [`Tipos de fornecedor: ${selectedSupplierTypes.join(', ')}`]
                    : []),
            ];

            const description = [newType.description.trim(), ...metadataLines]
                .filter(Boolean)
                .join(' | ');

            await documentTypeService.create({
                name: newType.name.trim(),
                description,
            });

            resetNewType();
            setIsCreating(false);
            loadTypes();
            toast.success('Tipo de documento criado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao criar:', error);
            toast.error(error.message || 'Erro ao criar tipo de documento.');
        }
    };

    const parseDescriptionMetadata = (rawDescription?: string) => {
        const tokens = (rawDescription || '')
            .split(' | ')
            .map((token) => token.trim())
            .filter(Boolean);

        let periodicity = '';
        let categories: string[] = [];
        let companyClassifications: string[] = [];
        let isSpecificDocument = false;
        let isOptionalDocument = false;
        let supplierTypeIds: string[] = [];
        let supplierTypeNames: string[] = [];
        const plainDescriptionTokens: string[] = [];

        for (const token of tokens) {
            if (token.startsWith('Periodicidade:')) {
                periodicity = token.replace('Periodicidade:', '').trim();
                continue;
            }
            if (token.startsWith('Categorias:')) {
                const value = token.replace('Categorias:', '').trim();
                categories = value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
                continue;
            }
            if (token.startsWith('Classificação Empresarial:')) {
                const value = token.replace('Classificação Empresarial:', '').trim();
                companyClassifications = value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
                continue;
            }
            if (token.startsWith('Documento específico:')) {
                const value = token.replace('Documento específico:', '').trim().toLowerCase();
                isSpecificDocument = value === 'sim';
                continue;
            }
            if (token.startsWith('Obrigatorio:')) {
                const value = token.replace('Obrigatorio:', '').trim().toLowerCase();
                isOptionalDocument = value === 'nao';
                continue;
            }
            if (token.startsWith('Tipos de fornecedor IDs:')) {
                const value = token.replace('Tipos de fornecedor IDs:', '').trim();
                supplierTypeIds = value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
                continue;
            }
            if (token.startsWith('Tipos de fornecedor:')) {
                const value = token.replace('Tipos de fornecedor:', '').trim();
                supplierTypeNames = value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
                continue;
            }
            plainDescriptionTokens.push(token);
        }

        return {
            description: plainDescriptionTokens.join(' | '),
            periodicity,
            categories,
            companyClassifications,
            isSpecificDocument,
            isOptionalDocument,
            supplierTypeIds,
            supplierTypeNames,
        };
    };

    const startEditing = (type: DocumentType) => {
        const parsed = parseDescriptionMetadata(sanitizeDescriptionDisplay(type.description));
        const supplierTypeIdsFromName = parsed.supplierTypeNames
            .map((name) => supplierTypes.find((item) => item.name === name)?.id)
            .filter((id): id is string => Boolean(id));
        const resolvedSupplierTypeIds = parsed.supplierTypeIds.length > 0
            ? parsed.supplierTypeIds
            : supplierTypeIdsFromName;

        setIsCreating(false);
        setEditingId(type.id);
        setEditForm({
            name: type.name,
            description: parsed.description,
            periodicity: parsed.periodicity,
            categories: parsed.categories,
            companyClassifications: parsed.companyClassifications,
            isSpecificDocument: parsed.isSpecificDocument,
            supplierTypeIds: resolvedSupplierTypeIds,
            isOptionalDocument: parsed.isOptionalDocument,
        });
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleUpdate = async (id: number) => {
        if (!editForm.name.trim()) {
            toast.error('Informe o nome do documento.');
            return;
        }
        if (!editForm.periodicity) {
            toast.error('Selecione a periodicidade.');
            return;
        }
        if (editForm.categories.length === 0) {
            toast.error('Selecione pelo menos uma categoria.');
            return;
        }
        if (editForm.companyClassifications.length === 0) {
            toast.error('Selecione ao menos uma classificação empresarial.');
            return;
        }
        if (editForm.isSpecificDocument && editForm.supplierTypeIds.length === 0) {
            toast.error('Selecione ao menos um tipo de fornecedor para documento específico.');
            return;
        }

        try {
            const selectedSupplierTypes = supplierTypes
                .filter((item) => editForm.supplierTypeIds.includes(item.id))
                .map((item) => item.name);

            const metadataLines = [
                getScopeToken(scope),
                ...(isWorkforceScope
                    ? [`Obrigatorio: ${editForm.isOptionalDocument ? 'Nao' : 'Sim'}`]
                    : []),
                `Periodicidade: ${editForm.periodicity}`,
                `Categorias: ${editForm.categories.join(', ')}`,
                `Classificação Empresarial: ${editForm.companyClassifications.join(', ')}`,
                `Documento específico: ${editForm.isSpecificDocument ? 'Sim' : 'Não'}`,
                ...(editForm.isSpecificDocument && selectedSupplierTypes.length > 0
                    ? [`Tipos de fornecedor: ${selectedSupplierTypes.join(', ')}`]
                    : []),
            ];
            const description = [editForm.description.trim(), ...metadataLines]
                .filter(Boolean)
                .join(' | ');

            await documentTypeService.update(id, {
                name: editForm.name.trim(),
                description,
            });
            setEditingId(null);
            setEditForm({
                name: '',
                description: '',
                periodicity: '',
                categories: [],
                companyClassifications: [],
                isSpecificDocument: false,
                supplierTypeIds: [],
                isOptionalDocument: false,
            });
            loadTypes();
            toast.success('Tipo de documento atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            toast.error('Erro ao atualizar tipo de documento.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este tipo?')) return;
        try {
            await documentTypeService.delete(id);
            loadTypes();
            toast.success('Tipo de documento excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir tipo de documento.');
        }
    };

    const totalPages = Math.max(1, Math.ceil(types.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const paginatedTypes = types.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Tipos de Documentos</h2>
                    <p className="text-sm text-gray-500">
                        {isWorkforceScope
                            ? 'Gerencie os documentos que podem ser exigidos dos colaboradores terceirizados.'
                            : 'Gerencie os documentos que podem ser exigidos dos fornecedores.'}
                    </p>
                </div>
                {!isCreating && editingId === null && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setEditForm({
                                name: '',
                                description: '',
                                periodicity: '',
                                categories: [],
                                companyClassifications: [],
                                isSpecificDocument: false,
                                supplierTypeIds: [],
                                isOptionalDocument: false,
                            });
                            setIsCreating(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        Novo Tipo
                    </button>
                )}
            </div>

            <div className="p-6">
                {isCreating && (
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Novo Tipo de Documento</h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do documento</Label>
                                <Input
                                    type="text"
                                    placeholder="Ex: Contrato Social"
                                    value={newType.name}
                                    onChange={e => setNewType({ ...newType, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input
                                    type="text"
                                    placeholder="Descrição (opcional)"
                                    value={newType.description}
                                    onChange={e => setNewType({ ...newType, description: e.target.value })}
                                />
                            </div>

                            {isWorkforceScope && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={newType.isOptionalDocument}
                                            onChange={(e) =>
                                                setNewType((current) => ({
                                                    ...current,
                                                    isOptionalDocument: e.target.checked,
                                                }))
                                            }
                                            className="h-4 w-4"
                                        />
                                        <span className="font-medium text-gray-700">Documento não obrigatório</span>
                                    </label>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Periodicidade</Label>
                                <Select
                                    value={newType.periodicity}
                                    onValueChange={(value) => setNewType({ ...newType, periodicity: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma opção" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {periodicityOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Categorias</Label>
                                    <button
                                        type="button"
                                        onClick={() => openCategoryModal('new')}
                                        className="text-xs font-medium tracking-wide text-orange-600 hover:text-orange-700 transition-colors"
                                    >
                                        + ADICIONAR CATEGORIA
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {categoryOptions.map((category) => {
                                        const checked = newType.categories.includes(category);
                                        return (
                                            <label key={category} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() =>
                                                        setNewType((current) => ({
                                                            ...current,
                                                            categories: checked
                                                                ? current.categories.filter((item) => item !== category)
                                                                : [...current.categories, category],
                                                        }))
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                <span>{category}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Classificação Empresarial</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {companyClassificationOptions.map((classification) => {
                                        const selected = newType.companyClassifications.includes(classification);
                                        return (
                                            <button
                                                key={classification}
                                                type="button"
                                                onClick={() =>
                                                    setNewType((current) => ({
                                                        ...current,
                                                        companyClassifications: selected
                                                            ? current.companyClassifications.filter((item) => item !== classification)
                                                            : [...current.companyClassifications, classification],
                                                    }))
                                                }
                                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                                    selected
                                                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {classification}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={newType.isSpecificDocument}
                                        onChange={(e) =>
                                            setNewType((current) => ({
                                                ...current,
                                                isSpecificDocument: e.target.checked,
                                                supplierTypeIds: e.target.checked ? current.supplierTypeIds : [],
                                            }))
                                        }
                                        className="h-4 w-4"
                                    />
                                    <span className="font-medium text-gray-700">Documento específico</span>
                                </label>
                            </div>

                            {newType.isSpecificDocument && (
                                <div className="space-y-2">
                                    <Label>Tipos de fornecedor</Label>
                                    {sortedSupplierTypes.length === 0 ? (
                                        <p className="text-sm text-gray-500">Nenhum tipo de fornecedor disponível.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {sortedSupplierTypes.map((supplierType) => {
                                                const selected = newType.supplierTypeIds.includes(supplierType.id);
                                                return (
                                                    <button
                                                        key={supplierType.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setNewType((current) => ({
                                                                ...current,
                                                                supplierTypeIds: selected
                                                                    ? current.supplierTypeIds.filter((item) => item !== supplierType.id)
                                                                    : [...current.supplierTypeIds, supplierType.id],
                                                            }))
                                                        }
                                                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                                            selected
                                                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {supplierType.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setIsCreating(false); resetNewType(); }}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-md text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newType.name.trim()}
                                className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm disabled:opacity-50"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                )}

                {editingId !== null && (
                    <div ref={formSectionRef} className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Editar Tipo de Documento</h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do documento</Label>
                                <Input
                                    type="text"
                                    placeholder="Ex: Contrato Social"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input
                                    type="text"
                                    placeholder="Descrição (opcional)"
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                />
                            </div>

                            {isWorkforceScope && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={editForm.isOptionalDocument}
                                            onChange={(e) =>
                                                setEditForm((current) => ({
                                                    ...current,
                                                    isOptionalDocument: e.target.checked,
                                                }))
                                            }
                                            className="h-4 w-4"
                                        />
                                        <span className="font-medium text-gray-700">Documento não obrigatório</span>
                                    </label>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Periodicidade</Label>
                                <Select
                                    value={editForm.periodicity}
                                    onValueChange={(value) => setEditForm({ ...editForm, periodicity: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma opção" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {periodicityOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Categorias</Label>
                                    <button
                                        type="button"
                                        onClick={() => openCategoryModal('edit')}
                                        className="text-xs font-medium tracking-wide text-orange-600 hover:text-orange-700 transition-colors"
                                    >
                                        + ADICIONAR CATEGORIA
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {categoryOptions.map((category) => {
                                        const checked = editForm.categories.includes(category);
                                        return (
                                            <label key={category} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() =>
                                                        setEditForm((current) => ({
                                                            ...current,
                                                            categories: checked
                                                                ? current.categories.filter((item) => item !== category)
                                                                : [...current.categories, category],
                                                        }))
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                <span>{category}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Classificação Empresarial</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {companyClassificationOptions.map((classification) => {
                                        const selected = editForm.companyClassifications.includes(classification);
                                        return (
                                            <button
                                                key={classification}
                                                type="button"
                                                onClick={() =>
                                                    setEditForm((current) => ({
                                                        ...current,
                                                        companyClassifications: selected
                                                            ? current.companyClassifications.filter((item) => item !== classification)
                                                            : [...current.companyClassifications, classification],
                                                    }))
                                                }
                                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                                    selected
                                                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {classification}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isSpecificDocument}
                                        onChange={(e) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                isSpecificDocument: e.target.checked,
                                                supplierTypeIds: e.target.checked ? current.supplierTypeIds : [],
                                            }))
                                        }
                                        className="h-4 w-4"
                                    />
                                    <span className="font-medium text-gray-700">Documento específico</span>
                                </label>
                            </div>

                            {editForm.isSpecificDocument && (
                                <div className="space-y-2">
                                    <Label>Tipos de fornecedor</Label>
                                    {sortedSupplierTypes.length === 0 ? (
                                        <p className="text-sm text-gray-500">Nenhum tipo de fornecedor disponível.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {sortedSupplierTypes.map((supplierType) => {
                                                const selected = editForm.supplierTypeIds.includes(supplierType.id);
                                                return (
                                                    <button
                                                        key={supplierType.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setEditForm((current) => ({
                                                                ...current,
                                                                supplierTypeIds: selected
                                                                    ? current.supplierTypeIds.filter((item) => item !== supplierType.id)
                                                                    : [...current.supplierTypeIds, supplierType.id],
                                                            }))
                                                        }
                                                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                                            selected
                                                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {supplierType.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setEditForm({
                                        name: '',
                                        description: '',
                                        periodicity: '',
                                        categories: [],
                                        companyClassifications: [],
                                        isSpecificDocument: false,
                                        supplierTypeIds: [],
                                        isOptionalDocument: false,
                                    });
                                    setIsCreating(false);
                                    resetNewType();
                                }}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-md text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleUpdate(editingId)}
                                disabled={!editForm.name.trim()}
                                className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm disabled:opacity-50"
                            >
                                Salvar alterações
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3 w-32 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {types.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">Nenhum tipo cadastrado.</td>
                                </tr>
                            ) : (
                                paginatedTypes.map(type => {
                                    const parsed = parseDescriptionMetadata(sanitizeDescriptionDisplay(type.description));

                                    return (
                                        <tr key={type.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{type.name}</div>
                                                {parsed.categories.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {parsed.categories.map((category) => (
                                                            <span
                                                                key={`${type.id}-${category}`}
                                                                className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                                                            >
                                                                {category}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{parsed.description || '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => startEditing(type)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(type.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {types.length > itemsPerPage && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, types.length)} de {types.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={safeCurrentPage === 1}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {safeCurrentPage} de {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={safeCurrentPage === totalPages}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {isCategoryModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4"
                    onClick={() => {
                        setIsCategoryModalOpen(false);
                        setCategoryDraft('');
                    }}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-orange-300 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between bg-orange-500 px-6 py-4">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                                <Settings2 size={16} />
                                Nova Categoria
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCategoryModalOpen(false);
                                    setCategoryDraft('');
                                }}
                                className="rounded-md p-1 text-white/90 hover:bg-white/20 hover:text-white"
                                aria-label="Fechar"
                            >
                                <span className="text-lg leading-none">&times;</span>
                            </button>
                        </div>
                        <div className="space-y-4 px-6 py-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-gray-500">
                                    NOME DA CATEGORIA
                                </Label>
                                <Input
                                    autoFocus
                                    value={categoryDraft}
                                    onChange={(e) => setCategoryDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCategory();
                                        }
                                        if (e.key === 'Escape') {
                                            setIsCategoryModalOpen(false);
                                            setCategoryDraft('');
                                        }
                                    }}
                                    placeholder="Ex: Ambiental"
                                    className="border-orange-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-orange-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCategoryModalOpen(false);
                                        setCategoryDraft('');
                                    }}
                                    className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


