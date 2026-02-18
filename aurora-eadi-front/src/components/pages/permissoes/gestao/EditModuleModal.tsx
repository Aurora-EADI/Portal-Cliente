"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Edit,
  Check,
  AlertCircle,
  Layers,
  FileText,
  Route,
  Image,
  ToggleLeft,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Calendar,
  MessageSquare,
  Mail,
  Bell,
  Shield,
  LayoutDashboard,
  Wrench,
  Database,
  Navigation,
} from "lucide-react";
import type { Module, UpdateModuleDto, ModuleSubPage } from "@/types/module";

interface AvailableRoute {
  path: string;
  label: string;
  icon: string;
  parentPath?: string;
}

// Mapa de ícones disponíveis
const AVAILABLE_ICONS = [
  { name: "Package", icon: Package },
  { name: "Truck", icon: Truck },
  { name: "FileText", icon: FileText },
  { name: "Users", icon: Users },
  { name: "BarChart3", icon: BarChart3 },
  { name: "Settings", icon: Settings },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "CreditCard", icon: CreditCard },
  { name: "Briefcase", icon: Briefcase },
  { name: "Calendar", icon: Calendar },
  { name: "MessageSquare", icon: MessageSquare },
  { name: "Mail", icon: Mail },
  { name: "Bell", icon: Bell },
  { name: "Shield", icon: Shield },
  { name: "LayoutDashboard", icon: LayoutDashboard },
  { name: "Layers", icon: Layers },
  { name: "Wrench", icon: Wrench },
  { name: "Database", icon: Database },
];

interface EditModuleModalProps {
  isOpen: boolean;
  module: Module | null;
  onClose: () => void;
  onSave: (id: number, data: UpdateModuleDto) => Promise<void>;
  error: string | null;
  onClearError: () => void;
  availableRoutes?: AvailableRoute[];
  availableSubRoutes?: AvailableRoute[];
}

export function EditModuleModal({
  isOpen,
  module,
  onClose,
  onSave,
  error,
  onClearError,
  availableRoutes = [],
  availableSubRoutes = [],
}: EditModuleModalProps) {
  const [formData, setFormData] = useState<UpdateModuleDto>({
    name: "",
    description: "",
    route: "",
    icon: "",
    active: true,
  });
  const [subPages, setSubPages] = useState<ModuleSubPage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Sub-rotas filtradas para a rota do módulo
  const filteredSubRoutes = useMemo(() => {
    if (!formData.route) return [];
    return availableSubRoutes.filter((r) => r.parentPath === formData.route);
  }, [formData.route, availableSubRoutes]);

  // Atualiza o formulário quando o módulo muda
  useEffect(() => {
    if (module) {
      setFormData({
        name: module.name,
        description: module.description || "",
        route: module.route || "",
        icon: module.icon || "",
        active: module.active ?? true,
      });
      setSubPages(
        module.sharedItems?.map((item) => ({
          targetRoute: item.targetRoute,
          label: item.label,
          icon: item.icon || undefined,
          sortOrder: item.sortOrder ?? 0,
        })) || []
      );
    }
  }, [module]);

  const handleSubmit = async () => {
    if (!module) return;
    onClearError();

    try {
      setIsSaving(true);
      await onSave(module.id, { ...formData, subPages });
    } catch (err) {
      // Erro será tratado pelo componente pai
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
      onClearError();
      setShowIconPicker(false);
    }
  };

  const handleToggleSubPage = (route: AvailableRoute) => {
    const exists = subPages.find((sp) => sp.targetRoute === route.path);
    if (exists) {
      setSubPages(subPages.filter((sp) => sp.targetRoute !== route.path));
    } else {
      setSubPages([
        ...subPages,
        {
          targetRoute: route.path,
          label: route.label,
          icon: route.icon,
          sortOrder: subPages.length,
        },
      ]);
    }
  };

  const getSelectedIcon = () => {
    const found = AVAILABLE_ICONS.find((i) => i.name === formData.icon);
    return found ? found.icon : Package;
  };

  // Se não está aberto ou não tem módulo, não renderiza nada
  if (!isOpen || !module) return null;

  const SelectedIconComponent = getSelectedIcon();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Editar Modulo</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Atualize as informacoes de {module.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Alert dentro do Modal */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-in slide-in-from-top duration-200">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Erro na validacao
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={onClearError}
              className="ml-2 text-red-400 hover:text-red-600 transition-colors"
              aria-label="Fechar alerta"
            >
              x
            </button>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Modulo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Modulo
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="Ex: Faturamento"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isSaving}
                />
                <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Rota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rota
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  value={formData.route}
                  onChange={(e) => {
                    setFormData({ ...formData, route: e.target.value });
                    // Limpa sub-páginas ao trocar de rota
                    setSubPages([]);
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
                <Route className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selecione a pagina do sistema que este modulo representa.
              </p>
            </div>

            {/* Icone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icone
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  disabled={isSaving}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-left bg-white flex items-center justify-between"
                >
                  <span className={formData.icon ? "text-gray-900" : "text-gray-400"}>
                    {formData.icon || "Selecione um icone..."}
                  </span>
                  <SelectedIconComponent className="w-5 h-5 text-gray-600" />
                </button>
                <Image className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>

              {/* Icon Picker Dropdown */}
              {showIconPicker && (
                <div className="absolute z-20 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = formData.icon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, icon: item.name });
                            setShowIconPicker(false);
                          }}
                          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                            isSelected
                              ? "bg-primary-100 text-primary-600 ring-2 ring-primary-500"
                              : "hover:bg-gray-100 text-gray-600"
                          }`}
                          title={item.name}
                        >
                          <IconComponent className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Status Ativo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, active: !formData.active })
                  }
                  disabled={isSaving}
                  className={`w-full pl-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-left flex items-center justify-between ${
                    formData.active
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <span
                    className={
                      formData.active ? "text-green-700" : "text-gray-600"
                    }
                  >
                    {formData.active ? "Ativo" : "Inativo"}
                  </span>
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.active ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </div>
                </button>
                <ToggleLeft className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Descricao - ocupa 2 colunas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descricao
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors resize-none"
                  placeholder="Descreva a funcao deste modulo..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isSaving}
                />
                <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximo de 500 caracteres
              </p>
            </div>
          </div>

          {/* Sub-páginas do Sidebar */}
          {filteredSubRoutes.length > 0 && (
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-800">
                  Sub-paginas no Sidebar
                </h4>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Selecione quais paginas devem aparecer no menu lateral deste modulo.
              </p>
              <div className="space-y-2">
                {filteredSubRoutes.map((route) => {
                  const isSelected = subPages.some(
                    (sp) => sp.targetRoute === route.path
                  );
                  return (
                    <label
                      key={route.path}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSubPage(route)}
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

          {/* Info sobre atividades */}
          {module.activities && module.activities.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Layers className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Atividades vinculadas
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Este modulo possui {module.activities.length} atividade(s)
                    vinculada(s). As atividades nao serao afetadas por esta
                    edicao.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !formData.name || !formData.route || !formData.icon}
              className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium flex items-center shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Alteracoes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
