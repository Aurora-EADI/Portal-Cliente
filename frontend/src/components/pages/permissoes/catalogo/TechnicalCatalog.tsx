"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Search,
    Plus,
    Trash2,
    Key,
    Shield,
    AlertCircle,
    Save,
    X,
    Database,
    Tag,
    FileText,
    Check
} from "lucide-react";
import { permissionsService } from "@/services/permissions/permissions.service";
import type { Permission } from "@/types/permission";

export function TechnicalCatalog() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [categories, setCategories] = useState<string[]>([]);

    // Form state
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        key: "",
        description: "",
        category: "",
        newCategory: "" // Helper for custom category input
    });

    useEffect(() => {
        fetchPermissions();
        fetchCategories();
    }, []);

    const fetchPermissions = async () => {
        try {
            setIsLoading(true);
            const data = await permissionsService.findAll();
            setPermissions(data);
        } catch (err: any) {
            console.error("Erro ao carregar permissões:", err);
            setError("Erro ao carregar catálogo técnico.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            // Extract unique categories from permissions if service doesn't have a specific endpoint
            // Or use permissionsService.getCategories() if available (it was in the service file)
            const cats = await permissionsService.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error("Error fetching categories", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.key || !formData.description) {
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            const categoryToSave = formData.category === "OTHER" ? formData.newCategory : formData.category;

            const response = await permissionsService.create({
                key: formData.key.toUpperCase().trim(),
                description: formData.description,
                category: categoryToSave
            });

            setPermissions(prev => [...prev, response.permission]);

            // Update categories list if new one was added
            if (categoryToSave && !categories.includes(categoryToSave)) {
                setCategories(prev => [...prev, categoryToSave]);
            }

            setIsAdding(false);
            resetForm();
        } catch (err: any) {
            console.error("Erro ao criar permissão:", err);
            setError(err.response?.data?.message || "Erro ao criar item no catálogo.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza? Isso pode afetar funcionalidades do sistema que dependam desta chave.")) return;

        try {
            setDeletingId(id);
            await permissionsService.remove(id);
            setPermissions(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.message || "Erro ao excluir item.");
        } finally {
            setDeletingId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            key: "",
            description: "",
            category: "",
            newCategory: ""
        });
    };

    const filteredPermissions = useMemo(() => {
        return permissions.filter(p =>
            p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            p.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [permissions, searchTerm]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                            <Database className="w-6 h-6 text-primary-600" />
                        </div>
                        Catálogo Técnico
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-2xl">
                        Central de gerenciamento de chaves de permissão.
                        Crie e organize as chaves técnicas que serão vinculadas aos módulos do sistema.
                    </p>
                </div>

                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-medium tracking-wide active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Registro
                    </button>
                )}
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 flex items-start shadow-sm animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-red-800">ocorreu um erro</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-400 hover:text-red-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Creation Form */}
            {isAdding && (
                <div className="bg-white rounded-xl shadow-lg border border-primary-100 overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-primary-100/50">
                    <div className="bg-gradient-to-r from-primary-50 to-white px-8 py-5 border-b border-primary-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary-600" />
                                Novo Registro Técnico
                            </h3>
                            <p className="text-xs text-primary-700 mt-1">Preencha os dados da nova chave de permissão</p>
                        </div>
                        <button
                            onClick={() => { setIsAdding(false); resetForm(); }}
                            className="bg-white p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all shadow-sm border border-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                        Chave Técnica (Key) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Key className="w-5 h-5 absolute left-3 top-2.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="EX: FAT_DETALHADO"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm uppercase transition-all"
                                            value={formData.key}
                                            onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Identificador único no código. Apenas letras maiúsculas, números e underline.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                        Categoria
                                    </label>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <select
                                                className="w-full pl-3 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer hover:border-primary-400 transition-colors"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="">Selecione uma categoria...</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="OTHER" className="font-bold text-primary-600">+ Nova Categoria</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                            </div>
                                        </div>

                                        {formData.category === "OTHER" && (
                                            <div className="animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    type="text"
                                                    placeholder="Digite o nome da nova categoria..."
                                                    className="w-full px-4 py-2.5 border-2 border-primary-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/30"
                                                    value={formData.newCategory}
                                                    onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })}
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                        Nome / Descrição <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <FileText className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                        <textarea
                                            placeholder="Descreva a finalidade desta permissão de forma clara para o usuário final..."
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[140px] resize-none transition-all"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); resetForm(); }}
                                className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-md hover:shadow-lg transition-all min-w-[140px] flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Salvar Registro
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                {/* Custom Filter Bar */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Tag className="w-4 h-4" />
                        <span>{filteredPermissions.length} registros encontrados</span>
                    </div>

                    <div className="relative w-full sm:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por chave, nome ou categoria..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Carregando catálogo...</p>
                    </div>
                ) : filteredPermissions.length > 0 ? (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">Chave Técnica</th>
                                    <th className="px-6 py-4">Descrição</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPermissions.map((item) => (
                                    <tr key={item.id} className="hover:bg-primary-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-2 rounded border border-gray-200 shadow-sm text-gray-400">
                                                    <Key className="w-4 h-4" />
                                                </div>
                                                <div className="font-mono text-xs text-primary-700 font-bold bg-primary-50 px-2.5 py-1 rounded-md border border-primary-100">
                                                    {item.key}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="font-medium text-gray-900 leading-snug">{item.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.category ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                    {item.category}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Sem categoria
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deletingId === item.id}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-60 group-hover:opacity-100"
                                                title="Excluir Registro"
                                            >
                                                {deletingId === item.id ? (
                                                    <div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-gray-50/30">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-gray-100">
                            <Database className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-1">Nenhum registro encontrado</h3>
                        <p className="text-gray-500 text-sm max-w-xs text-center">
                            {searchTerm
                                ? "Não encontramos nada com os termos pesquisados."
                                : "O catálogo está vazio. Comece adicionando uma nova chave técnica."}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-primary-600 hover:underline text-sm font-medium"
                            >
                                Limpar busca
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
