"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  Key,
  AlertCircle,
  Search,
  Link as LinkIcon,
  Lock,
  Package,
  ArrowRight,
  Database,
} from "lucide-react";
import * as Icons from 'lucide-react';
import { modulesService } from "@/services/modules/modules.service";
import { activitiesService } from "@/services/activities/activities.service";
import { permissionsService } from "@/services/permissions/permissions.service";
import type { Module } from "@/types/module";
import type { Activity } from "@/types/activity";
import type { Permission } from "@/types/permission";

interface CatalogItem {
  key: string;
  label: string;
  category: string;
}

// ==================== COMPONENT ====================

export function ActivityRegistry() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [isMandatory, setIsMandatory] = useState(false);
  const [customName, setCustomName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);


  // Carrega módulos, atividades e permissões
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [modulesData, activitiesData, permissionsData] = await Promise.all([
        modulesService.findAll(),
        activitiesService.findAll(),
        permissionsService.findAll(),
      ]);

      setModules(modulesData);
      setActivities(activitiesData);
      setPermissions(permissionsData);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.response?.data?.message || "Erro ao carregar dados. Verifique sua conexão.");
    } finally {
      setIsLoading(false);
    }
  };


  // Auto-select first module
  useEffect(() => {
    if (modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  const selectedModule = modules.find((m) => m.id === selectedModuleId);


  // Activities already linked to the CURRENT module
  const currentModuleActivities = activities.filter(
    (a) => a.moduleId === selectedModuleId
  );

  // Activities linked to ANY module
  const allLinkedKeys = new Set(
    activities.flatMap(
      (a) => a.permissions?.map((p) => p.key) || []
    )
  );

  // Build catalog from available permissions
  const systemCatalog: CatalogItem[] = useMemo(() => {
    return permissions.map((p) => ({
      key: p.key,
      label: p.description || p.key,
      category: p.category || "Sem Categoria",
    }));
  }, [permissions]);

  // Filter Catalog
  const availablePermissions = useMemo(() => {
    // Pegamos apenas as chaves já vinculadas ao módulo ATUAL
    const currentModuleLinkedKeys = new Set(
      currentModuleActivities.flatMap(
        (a) => a.permissions?.map((p) => p.key) || []
      )
    );

    return systemCatalog.filter((item) => {
      const matchesSearch =
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.key.toLowerCase().includes(searchTerm.toLowerCase());

      // Agora verificamos se a chave não está vinculada APENAS neste módulo
      const notInCurrentModule = !currentModuleLinkedKeys.has(item.key);

      return matchesSearch && notInCurrentModule;
    });
  }, [searchTerm, currentModuleActivities, systemCatalog]);

  const handleSelectCatalogItem = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setCustomName(item.label);
    setIsMandatory(false);
  };

  const handleLinkActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogItem || !selectedModuleId) return;

    try {
      setIsSaving(true);
      setError(null);

      // Encontra o ID da permissão pelo key
      const permission = permissions.find((p) => p.key === selectedCatalogItem.key);
      if (!permission) {
        throw new Error("Permissão não encontrada");
      }

      const response = await activitiesService.create({
        moduleId: selectedModuleId,
        name: customName,
        isMandatory: isMandatory,
        permissionIds: [permission.id],
      });

      // Atualiza a lista de atividades localmente
      setActivities((prev) => [...prev, response.activity]);

      // Reset selection
      setSelectedCatalogItem(null);
      setCustomName("");
      setIsMandatory(false);
    } catch (err: any) {
      console.error("Erro ao vincular atividade:", err);
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else {
        setError(errorMessage || "Erro ao vincular atividade. Tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm("Tem certeza que deseja remover este vínculo?")) {
      return;
    }

    try {
      setDeletingId(activityId);
      setError(null);
      await activitiesService.remove(activityId);
      setActivities((prev) => prev.filter((activity) => activity.id !== activityId));
    } catch (err: any) {
      console.error("Erro ao excluir atividade:", err);
      const errorMessage = err.response?.data?.message;
      setError(errorMessage || "Erro ao excluir atividade.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-yellow-500 mr-4" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Atenção</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Você precisa criar <strong>Módulos</strong> antes de vincular atividades.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Componente helper para renderizar ícone dinâmico
  const DynamicIcon = ({ iconName, ...props }: { iconName: string;[key: string]: any }) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;

    if (!IconComponent) {
      // Fallback para um ícone padrão caso o nome não seja encontrado
      return <Icons.Package {...props} />;
    }

    return <IconComponent {...props} />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Erro</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Header & Module Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Módulo Destino
              </label>
              <a
                href="/permissoes/catalogo"
                className="text-xs text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1"
              >
                Gerenciar Catálogo Técnico <Icons.ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <select
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-primary-500 focus:outline-none text-lg text-gray-800 font-semibold transition-all hover:bg-gray-100 cursor-pointer"
                value={selectedModuleId || ""}
                onChange={(e) => {
                  setSelectedModuleId(Number(e.target.value));
                  setSelectedCatalogItem(null);
                }}
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <Package className="w-6 h-6 text-primary-600 absolute left-3 top-3.5 pointer-events-none" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {selectedModule?.description}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-primary-50 px-4 py-3 rounded-lg border border-primary-100">
            <div className="text-center">
              <span className="block text-2xl font-bold text-primary-600">
                {currentModuleActivities.length}
              </span>
              <span className="text-xs text-primary-800 uppercase font-bold">
                Atuais
              </span>
            </div>
            <div className="h-8 w-px bg-primary-200 mx-2"></div>
            <div className="text-xs text-primary-800 max-w-[120px]">
              Permissões já ativas neste módulo
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: List of Existing/Linked Activities */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="bg-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 text-white">
                1
              </span>
              Atividades Vinculadas
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
            {currentModuleActivities.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {currentModuleActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className="px-5 py-4 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-medium text-gray-900">
                          {activity.name}
                        </p>
                        {activity.isMandatory && (
                          <span className="flex items-center gap-1 text-[10px] uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-bold tracking-wide">
                            <Lock className="w-3 h-3" /> Obrigatório
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {activity.permissions?.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100"
                          >
                            <Key className="w-3 h-3 mr-1" />
                            {permission.key}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remover vínculo"
                      disabled={deletingId === activity.id}
                    >
                      {deletingId === activity.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <LinkIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-gray-900 font-medium">Nenhum vínculo ativo</h4>
                <p className="text-gray-500 text-sm mt-1 max-w-xs">
                  Selecione atividades da lista técnica ao lado para disponibilizá-las
                  neste módulo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Available System Activities (Catalog) */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="bg-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 text-white">
              2
            </span>
            Catálogo Técnico (Disponíveis)
          </h3>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col h-[500px]">
            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar por nome ou chave técnica..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>

            {/* List or Form */}
            {!selectedCatalogItem ? (
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {availablePermissions.length > 0 ? (
                  availablePermissions.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSelectCatalogItem(item)}
                      className="w-full text-left bg-white p-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:shadow-sm transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                            {item.category}
                          </span>
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-700">
                            {item.label}
                          </span>
                        </div>
                        <div className="bg-gray-100 p-1.5 rounded-full group-hover:bg-primary-100 transition-colors">
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                        </div>
                      </div>
                      <code className="text-[10px] text-gray-400 font-mono mt-1 block">
                        {item.key}
                      </code>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-500">
                      {searchTerm
                        ? "Nenhuma atividade encontrada."
                        : "Todas as atividades disponíveis já foram vinculadas."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Configuration Form for Selected Item
              <div className="bg-white rounded-lg border border-primary-200 shadow-lg p-5 flex flex-col h-full animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-primary-700 font-semibold">
                    <Database className="w-5 h-5" />
                    <span>Configurar Vínculo</span>
                  </div>
                  <button
                    onClick={() => setSelectedCatalogItem(null)}
                    className="text-xs text-gray-500 hover:text-gray-800 underline"
                  >
                    Voltar à lista
                  </button>
                </div>

                <form onSubmit={handleLinkActivity} className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Chave Técnica (Imutável)
                    </label>
                    <div className="flex items-center bg-gray-100 border border-gray-300 rounded px-3 py-2 text-gray-600 font-mono text-sm">
                      <Key className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedCatalogItem.key}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome de Exibição
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      disabled={isSaving}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Como esta permissão aparecerá para o usuário final.
                    </p>
                  </div>

                  <div className="py-2">
                    <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={isMandatory}
                        onChange={(e) => setIsMandatory(e.target.checked)}
                        disabled={isSaving}
                      />
                      <div>
                        <span className="block text-sm font-medium text-gray-900">
                          Vínculo Obrigatório
                        </span>
                        <span className="block text-xs text-gray-500">
                          Se marcado, o usuário não poderá desativar esta permissão na
                          tela de gestão.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-5 h-5 mr-2" />
                          Confirmar Vínculo ao Módulo
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}