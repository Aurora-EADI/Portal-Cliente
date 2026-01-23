"use client"
import React, { useState, useEffect } from 'react';
import { documentTypeService } from '../../../services/api';
import { DocumentType } from '../../../types';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function DocumentTypesManager() {
    const [types, setTypes] = useState<DocumentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newType, setNewType] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '' });

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            setLoading(true);
            const data = await documentTypeService.getAll();
            setTypes(data);
        } catch (error) {
            console.error('Erro ao carregar tipos:', error);
            toast.error('Erro ao carregar lista de tipos de documentos.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newType.name.trim()) return;
        try {
            await documentTypeService.create(newType);
            setNewType({ name: '', description: '' });
            setIsCreating(false);
            loadTypes();
            toast.success('Tipo de documento criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar:', error);
            toast.error('Erro ao criar tipo de documento.');
        }
    };

    const handleUpdate = async (id: number) => {
        try {
            await documentTypeService.update(id, editForm);
            setEditingId(null);
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

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Tipos de Documentos</h2>
                    <p className="text-sm text-gray-500">Gerencie os documentos que podem ser exigidos dos fornecedores.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        Novo Tipo
                    </button>
                )}
            </div>

            <div className="p-6">
                {isCreating && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Novo Tipo de Documento</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                type="text"
                                placeholder="Nome do Documento (Ex: Contrato Social)"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                value={newType.name}
                                onChange={e => setNewType({ ...newType, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Descrição (Opcional)"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                value={newType.description}
                                onChange={e => setNewType({ ...newType, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setIsCreating(false)}
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
                                types.map(type => (
                                    <tr key={type.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {editingId === type.id ? (
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-1 border border-primary-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                                    value={editForm.name}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                />
                                            ) : type.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {editingId === type.id ? (
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-1 border border-primary-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                                    value={editForm.description}
                                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                />
                                            ) : type.description || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {editingId === type.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdate(type.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setEditingId(type.id); setEditForm({ name: type.name, description: type.description || '' }); }}
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
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
