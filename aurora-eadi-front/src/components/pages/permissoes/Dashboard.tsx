"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Package, Truck, FileText, Users, BarChart3, Settings,
  ShoppingCart, CreditCard, Briefcase, Calendar, MessageSquare, Mail, 
  Bell, Shield, LayoutDashboard, Layers, Wrench, Database, AlertCircle, X, Activity
} from "lucide-react";
import { api } from "@/lib/api";

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
  activities?: Activity[];
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

  // Carrega módulos do backend
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

    if (!formData.route.trim()) {
      setError('A rota do módulo é obrigatória');
      return;
    }

    if (!formData.route.startsWith('/')) {
      setError('A rota deve começar com "/" (ex: /faturamento)');
      return;
    }

    if (!/^\/[a-z0-9-]+$/.test(formData.route)) {
      setError('A rota deve conter apenas letras minúsculas, números e hífens após a "/" inicial');
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
      });

      setModules((prev) => [...prev, response.data]);
      setFormData({ name: "", description: "", route: "", icon: "Package" });
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

  // Deleta módulo
  const handleDelete = async (moduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este módulo? Esta ação não pode ser desfeita.')) {
      return;
    }

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
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", route: "", icon: "Package" });
    setIsAdding(false);
    setError(null);
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
    <div className="space-y-6">
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
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="/faturamento"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        formData.route && !formData.route.startsWith('/')
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : formData.route && /^\/[a-z0-9-]+$/.test(formData.route)
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-orange-500 focus:border-transparent'
                      }`}
                      value={formData.route}
                      onChange={(e) =>
                        setFormData({ ...formData, route: e.target.value.toLowerCase() })
                      }
                      disabled={isSaving}
                      maxLength={50}
                    />
                    {formData.route && /^\/[a-z0-9-]+$/.test(formData.route) && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-xs text-blue-800 font-medium mb-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Formato obrigatório da rota:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                      <li>
                        Deve <strong>começar com "/"</strong> (ex: <code className="bg-blue-100 px-1 rounded">/faturamento</code>)
                      </li>
                      <li>
                        Apenas <strong>letras minúsculas</strong>, <strong>números</strong> e <strong>hífens</strong>
                      </li>
                      <li>
                        Sem espaços, acentos ou caracteres especiais
                      </li>
                      <li>
                        Exemplos válidos: <code className="bg-blue-100 px-1 rounded">/permissoes</code>, <code className="bg-blue-100 px-1 rounded">/gestao-usuarios</code>
                      </li>
                    </ul>
                  </div>
                </div>
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
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    {renderIcon(module.icon)}
                  </div>
                  <button
                    onClick={() => handleDelete(module.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                {/* <span title={module.id}>ID: {module.id.slice(0, 8)}...</span> */}
                <span className="bg-green-100 px-2 py-1 rounded text-green-700 font-medium">
                  Ativo
                </span>
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
  );
}