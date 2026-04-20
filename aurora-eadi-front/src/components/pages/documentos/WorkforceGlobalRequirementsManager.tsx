"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Search, Users } from 'lucide-react';
import { documentTypeService, requirementRulesService } from '@/services/api';
import { toast } from 'sonner';
import { filterDocumentTypesByScope } from '@/lib/documentTypeScope';

interface DocTypeOption {
  id: number;
  name: string;
}

export function WorkforceGlobalRequirementsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docTypes, setDocTypes] = useState<DocTypeOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredTypes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return docTypes;
    return docTypes.filter((item) => item.name.toLowerCase().includes(term));
  }, [docTypes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTypes.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedTypes = filteredTypes.slice(startIndex, startIndex + itemsPerPage);

  const loadData = async () => {
    try {
      setLoading(true);
      const [types, requirements] = await Promise.all([
        documentTypeService.getAll(),
        requirementRulesService.getGlobalWorkforceRequirements(),
      ]);

      const activeTypes = filterDocumentTypesByScope(types, 'WORKFORCE')
        .filter((type) => type.active)
        .map((type) => ({ id: type.id, name: type.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      setDocTypes(activeTypes);
      setSelectedIds(requirements.map((item) => item.documentTypeId));
    } catch (error) {
      console.error('Erro ao carregar documentos obrigatorios de colaboradores:', error);
      toast.error('Erro ao carregar documentos obrigatorios de colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleType = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await requirementRulesService.updateGlobalWorkforceRequirements(
        selectedIds.map((documentTypeId) => ({
          documentTypeId,
          isRequired: true,
        })),
      );
      toast.success('Documentos obrigatorios de colaboradores atualizados.');
    } catch (error) {
      console.error('Erro ao salvar documentos obrigatorios de colaboradores:', error);
      toast.error('Erro ao salvar documentos obrigatorios de colaboradores.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex justify-center">
        <Loader2 className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-primary-600" />
            Documentos Obrigatorios de Colaboradores
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Esta lista e global e sera cobrada para todos os colaboradores terceirizados.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 text-sm"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar tipo de documento..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {docTypes.length === 0 ? (
          <div className="text-sm text-gray-500">
            Nenhum tipo de documento ativo cadastrado.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3 w-44 text-right">Exigido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedTypes.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                      Nenhum documento encontrado para o filtro.
                    </td>
                  </tr>
                ) : (
                  paginatedTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{type.name}</td>
                      <td className="px-4 py-3 text-right">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSet.has(type.id)}
                            onChange={() => toggleType(type.id)}
                            className="h-4 w-4"
                          />
                          <span className="text-xs text-gray-600">
                            {selectedSet.has(type.id) ? 'Sim' : 'Nao'}
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {filteredTypes.length > itemsPerPage && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTypes.length)} de {filteredTypes.length}
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
                Pagina {safeCurrentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
