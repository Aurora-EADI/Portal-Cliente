"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit, Package, Truck, FileText, Users, BarChart3, Settings,
  ShoppingCart, CreditCard, Briefcase, Calendar, MessageSquare, Mail,
  Bell, Shield, LayoutDashboard, Layers, Wrench, Database, AlertCircle, X, Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { EditModuleModal } from "./gestao/EditModuleModal";
import { MODULE_ROUTES, SUB_ROUTES } from "@/config/routes/registry";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Module as ModuleType, UpdateModuleDto, ModuleSubPage } from "@/types/module";

interface AvailableRoute {
  path: string;
  label: string;
  icon: string;
  parentPath?: string;
}

// Mapa de ícones disponíveis
const ICON_MAP: Record<string, React.ElementType> = {
  Package, Truck, FileText, Users, BarChart3, Settings,
  ShoppingCart, CreditCard, Briefcase, Calendar, MessageSquare, Mail, 
  Bell, Shield, LayoutDashboard, Layers, Wrench, Database
};

// Types
interface Activity {
  id: string;
  name: string;
  isMandatory: boolean;
  permissions: Array<{
    id: string;
    permission: {
      id: string;
      key: string;
      name: string;
      description: string;
    };
  }>;
}

interface Module {
  id: string;
  name: string;
  description: string;
  route?: string;
  icon?: string;
  active?: boolean;
  activities?: Activity[];
  _count?: {
    userAccess: number;
  };
}

interface ModuleFormData {
  name: string;
  description: string;
  route: string;
  icon: string;
}

export function PermissoesDashboard() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ModuleFormData>({
    name: "",
    description: "",
    route: "",
    icon: "Package",
  });
  const [createSubPages, setCreateSubPages] = useState<ModuleSubPage[]>([]);

  // Modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null);
  const [moduleError, setModuleError] = useState<string | null>(null);

  // Dialog de confirmação de deleção
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

  // Rotas disponíveis do registry local (fonte única de verdade)
  const availableRoutes: AvailableRoute[] = MODULE_ROUTES;
  const availableSubRoutes: AvailableRoute[] = SUB_ROUTES;

  // Carrega módulos
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/modules');
      setModules(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar módulos:', err);
      setError(err.response?.data?.message || 'Erro ao carregar módulos. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cria novo módulo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('O nome do módulo é obrigatório');
      return;
    }

    if (!formData.route) {
      setError('A rota do módulo é obrigatória. Selecione uma rota disponível.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await api.post('/modules', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        route: formData.route.trim(),
        icon: formData.icon,
        subPages: createSubPages.length > 0 ? createSubPages : undefined,
      });

      setModules((prev) => [...prev, response.data]);
      setFormData({ name: "", description: "", route: "", icon: "Package" });
      setCreateSubPages([]);
      setIsAdding(false);
    } catch (err: any) {
      console.error('Erro ao criar módulo:', err);
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(', '));
      } else {
        setError(errorMessage || 'Erro ao criar módulo. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Abre o dialog de confirmação de deleção
  const handleDeleteClick = (module: Module) => {
    setModuleToDelete(module);
    setDeleteDialogOpen(true);
  };

  // Confirma e deleta o módulo
  const handleConfirmDelete = async () => {
    if (!moduleToDelete) return;

    const moduleId = moduleToDelete.id;

    try {
      setDeletingId(moduleId);
      setError(null);
      await api.delete(`/modules/${moduleId}`);
      setModules((prev) => prev.filter((module) => module.id !== moduleId));
    } catch (err: any) {
      console.error('Erro ao excluir módulo:', err);
      setError(err.response?.data?.message || 'Erro ao excluir módulo. Verifique se não há dependências.');
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", route: "", icon: "Package" });
    setIsAdding(false);
    setError(null);
  };

  // Abre o modal de edição
  const handleEditModule = (module: Module) => {
    // Converte o módulo local para o tipo esperado pelo modal
    const moduleForEdit: ModuleType = {
      ...module,
      id: Number(module.id),
      activities: module.activities?.map((a) => ({
        ...a,
        id: Number(a.id),
        permissions: a.permissions.map((p) => ({
          permission: {
            id: Number(p.permission.id),
            key: p.permission.key,
            description: p.permission.description,
            category: "",
          },
        })),
      })),
    };
    setSelectedModule(moduleForEdit);
    setModuleError(null);
    setEditModalOpen(true);
  };

  // Salva as alterações do módulo
  const handleSaveModule = async (id: number, data: UpdateModuleDto) => {
    try {
      await api.patch(`/modules/${id}`, data);
      // Recarrega todos os módulos para garantir dados atualizados
      await fetchModules();
      setEditModalOpen(false);
      setSelectedModule(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setModuleError(errorMessage.join(", "));
      } else {
        setModuleError(errorMessage || "Erro ao salvar módulo. Tente novamente.");
      }
      throw err;
    }
  };

  // Helper para renderizar o ícone dinamicamente
  const renderIcon = (iconName?: string) => {
    const IconComponent = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Package;
    return <IconComponent className="w-6 h-6" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Fixo */}
      <div className="flex-shrink-0 space-y-4 pb-4">
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
              aria-label="Fechar alerta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Módulos</h1>
            <p className="text-gray-500 mt-1">Gerencie os macro-módulos e permissões do sistema</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-all shadow-sm hover:shadow text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Módulo
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Scrollável */}
      <div className="flex-1 overflow-auto space-y-6 pb-6">

      {/* Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <Package className="w-5 h-5 mr-2 text-orange-600" />
            Cadastrar Novo Módulo
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Módulo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Financeiro, Logística, RH"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isSaving}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Breve descrição da finalidade deste módulo..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={isSaving}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rota do Módulo <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      formData.route
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:ring-orange-500 focus:border-transparent'
                    }`}
                    value={formData.route}
                    onChange={(e) => {
                      setFormData({ ...formData, route: e.target.value });
                      setCreateSubPages([]);
                    }}
                    disabled={isSaving}
                  >
                    <option value="">Selecione uma rota...</option>
                    {availableRoutes.map((route) => (
                      <option key={route.path} value={route.path}>
                        {route.label} ({route.path})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione a página do sistema que este módulo representa.
                  </p>
                </div>

                {/* Sub-páginas do Sidebar */}
                {formData.route && availableSubRoutes.filter((r) => r.parentPath === formData.route).length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub-páginas no Sidebar
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Selecione quais páginas devem aparecer no menu lateral deste módulo.
                    </p>
                    <div className="space-y-2">
                      {availableSubRoutes
                        .filter((r) => r.parentPath === formData.route)
                        .map((route) => {
                          const isSelected = createSubPages.some(
                            (sp) => sp.targetRoute === route.path
                          );
                          return (
                            <label
                              key={route.path}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-blue-300 bg-white'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setCreateSubPages(createSubPages.filter((sp) => sp.targetRoute !== route.path));
                                  } else {
                                    setCreateSubPages([
                                      ...createSubPages,
                                      {
                                        targetRoute: route.path,
                                        label: route.label,
                                        icon: route.icon,
                                        sortOrder: createSubPages.length,
                                      },
                                    ]);
                                  }
                                }}
                                disabled={isSaving}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-800">
                                  {route.label}
                                </span>
                                <span className="text-xs text-gray-400 ml-2">
                                  {route.path}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone de Identificação
                </label>
                <div className="grid grid-cols-6 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-[200px] overflow-y-auto">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const IconComp = ICON_MAP[iconKey];
                    const isSelected = formData.icon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconKey })}
                        disabled={isSaving}
                        className={`
                          flex items-center justify-center p-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed
                          ${isSelected 
                            ? 'bg-orange-600 text-white shadow-md scale-110' 
                            : 'bg-white text-gray-500 hover:bg-orange-100 hover:text-orange-600 border border-gray-200'}
                        `}
                        title={iconKey}
                      >
                        <IconComp className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Selecione um ícone que melhor represente este módulo.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Salvar Módulo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Grid */}
      {modules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-5 flex flex-col group min-h-[200px]"
            >
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    {renderIcon(module.icon)}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleEditModule(module)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
                      title="Editar módulo"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(module)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir módulo"
                      disabled={deletingId === module.id}
                    >
                      {deletingId === module.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed min-h-[40px]">
                  {module.description || "Sem descrição"}
                </p>

                {/* Route Info */}
                {module.route && (
                  <div className="mt-3 flex items-center text-xs">
                    <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                      {module.route}
                    </code>
                  </div>
                )}

                {/* Activities Count */}
                {module.activities && module.activities.length > 0 && (
                  <div className="mt-3 flex items-center text-xs text-gray-600">
                    <Activity className="w-3 h-3 mr-1" />
                    <span>{module.activities.length} atividade(s)</span>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-4">
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end text-xs text-gray-400">
                  {module.active !== false ? (
                    <span className="bg-green-100 px-2 py-1 rounded text-green-700 font-medium">
                      Ativo
                    </span>
                  ) : (
                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                      Inativo
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {modules.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Nenhum módulo cadastrado
          </h3>
          <p className="text-gray-500 mt-1 mb-4">
            Comece criando a estrutura do seu sistema.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Módulo
          </button>
        </div>
      )}
      </div>

      {/* Modal de Edição de Módulo */}
      <EditModuleModal
        isOpen={editModalOpen}
        module={selectedModule}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedModule(null);
        }}
        onSave={handleSaveModule}
        error={moduleError}
        onClearError={() => setModuleError(null)}
        availableRoutes={availableRoutes}
        availableSubRoutes={availableSubRoutes}
      />

      {/* Dialog de Confirmação de Deleção */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setDeleteDialogOpen(false);
            setModuleToDelete(null);
          }
        }}
        title="Excluir Módulo"
        description={(() => {
          const activitiesCount = moduleToDelete?.activities?.length || 0;
          const userAccessCount = moduleToDelete?._count?.userAccess || 0;
          const hasDependencies = activitiesCount > 0 || userAccessCount > 0;

          if (hasDependencies) {
            const parts = [];
            if (activitiesCount > 0) {
              parts.push(`${activitiesCount} atividade(s)`);
            }
            if (userAccessCount > 0) {
              parts.push(`${userAccessCount} acesso(s) de usuário(s)`);
            }
            return `O módulo "${moduleToDelete?.name}" possui ${parts.join(' e ')} vinculado(s) e não pode ser excluído. Remova as dependências primeiro ou desative o módulo.`;
          }
          return `Tem certeza que deseja excluir o módulo "${moduleToDelete?.name}"? Esta ação não pode ser desfeita.`;
        })()}
        confirmText={(() => {
          const hasDependencies = (moduleToDelete?.activities?.length || 0) > 0 || (moduleToDelete?._count?.userAccess || 0) > 0;
          return hasDependencies ? "Entendi" : "Excluir";
        })()}
        cancelText="Cancelar"
        variant={(() => {
          const hasDependencies = (moduleToDelete?.activities?.length || 0) > 0 || (moduleToDelete?._count?.userAccess || 0) > 0;
          return hasDependencies ? "default" : "destructive";
        })()}
        onConfirm={(() => {
          const hasDependencies = (moduleToDelete?.activities?.length || 0) > 0 || (moduleToDelete?._count?.userAccess || 0) > 0;
          return hasDependencies
            ? () => { setDeleteDialogOpen(false); setModuleToDelete(null); }
            : handleConfirmDelete;
        })()}
        isLoading={!!deletingId}
      />
    </div>
  );
}