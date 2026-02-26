"use client"

import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  User as UserIcon,
  Shield,
  Lock,
  CheckCircle2,
  Package,
  Truck,
  FileText,
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
  LayoutDashboard,
  Layers,
  Wrench,
  Database,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldCheck,
  Building2,
  UserCog,
} from "lucide-react";
import { UserRole } from "@/types";

import { usersService } from "@/services/users/users.service";
import { modulesService } from "@/services/modules/modules.service";
import { activitiesService } from "@/services/activities/activities.service";
import { userModuleAccessService } from "@/services/access/user-module-access.service";
import { userActivityAccessService } from "@/services/access/user-activity-access.service";
import type { User } from "@/types/user";
import type { Module } from "@/types/module";
import type { Activity } from "@/types/activity";
import type { UserModulesAccessStatus } from "@/types/access-control";
import { Pagination } from "@/components/ui/Pagination";

// ==================== TYPES ====================

interface LocalPermissionState {
  moduleEnabled: Record<number, boolean>;
  activityEnabled: Record<number, boolean>;
}

// ==================== ROLE CARDS CONFIG ====================

const ROLE_CARDS = [
  {
    role: UserRole.ADMIN,
    label: 'Administradores',
    icon: ShieldCheck,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
  {
    role: UserRole.EMPLOYEE,
    label: 'Colaboradores',
    icon: UserCog,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  {
    role: UserRole.SUPPLIER,
    label: 'Fornecedores',
    icon: Building2,
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
  },
];

// ==================== ICON MAP ====================

const ICON_MAP: Record<string, React.ElementType> = {
  Package,
  Truck,
  FileText,
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
  Layers,
  Wrench,
  Database,
};

// ==================== COMPONENT ====================

export function PermissionManagerPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userAccessStatus, setUserAccessStatus] = useState<UserModulesAccessStatus | null>(null);

  // Controle de módulos expandidos
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  // Busca/filtro de usuários
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");

  // Paginação de usuários
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(10);

  // Busca/filtro de módulos
  const [searchTerm, setSearchTerm] = useState("");

  // Local state for editing before saving
  const [localPermissions, setLocalPermissions] = useState<LocalPermissionState>({
    moduleEnabled: {},
    activityEnabled: {},
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega usuários, módulos e atividades
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [usersResponse, modulesData, activitiesData] = await Promise.all([
        usersService.findAll({ companyStatus: 'ACTIVE' }),
        modulesService.findAll(),
        activitiesService.findAll(),
      ]);

      setUsers(usersResponse.data);
      setModules(modulesData);
      setActivities(activitiesData);

      if (usersResponse.data.length > 0) {
        setSelectedUserId(usersResponse.data[0].id);
      }

      // Mantém todos os módulos colapsados por padrão
      const initialExpanded: Record<number, boolean> = {};
      modulesData.forEach(mod => {
        initialExpanded[mod.id] = false;
      });
      setExpandedModules(initialExpanded);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.response?.data?.message || "Erro ao carregar dados iniciais.");
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega permissões do usuário selecionado
  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchUserPermissions = async (userId: string) => {
    try {
      setError(null);
      const status = await userModuleAccessService.getUserModulesWithAccessStatus(userId);
      setUserAccessStatus(status);

      // Converte o status para o formato local
      const moduleEnabled: Record<number, boolean> = {};
      const activityEnabled: Record<number, boolean> = {};

      status.modules.forEach((module) => {
        moduleEnabled[module.id] = module.isEnabled;
        module.activities.forEach((activity) => {
          activityEnabled[activity.id] = activity.isActive;
        });
      });

      setLocalPermissions({ moduleEnabled, activityEnabled });
      setHasChanges(false);
      setSavedSuccess(false);
    } catch (err: any) {
      console.error("Erro ao carregar permissões:", err);
      setError(err.response?.data?.message || "Erro ao carregar permissões do usuário.");
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) return;

    try {
      setIsSaving(true);
      setError(null);

      // Salva módulos alterados
      const modulePromises = Object.entries(localPermissions.moduleEnabled).map(
        async ([moduleId, isEnabled]) => {
          const currentStatus = userAccessStatus?.modules.find(
            (m) => m.id === Number(moduleId)
          )?.isEnabled;

          if (currentStatus !== isEnabled) {
            return userModuleAccessService.toggleModule(
              selectedUserId,
              Number(moduleId),
              { isEnabled }
            );
          }
        }
      );

      await Promise.all(modulePromises.filter(Boolean));

      // Salva atividades alteradas
      const activityPromises = modules
        .filter((module) => localPermissions.moduleEnabled[module.id] ?? false)
        .map(async (module) => {
          const moduleActivities = activities.filter(
            (a) => a.moduleId === module.id
          );

          const changedActivities = moduleActivities
            .filter((activity) => {
              if (activity.isMandatory) return false;

              const moduleStatus = userAccessStatus?.modules.find((m) => m.id === module.id);
              const currentState = moduleStatus?.activities.find((a) => a.id === activity.id)?.isActive ?? false;
              const localState = localPermissions.activityEnabled[activity.id] ?? false;

              return currentState !== localState;
            })
            .map((activity) => ({
              activityId: activity.id,
              isEnabled: localPermissions.activityEnabled[activity.id] ?? false,
            }));

          if (changedActivities.length > 0) {
            return userActivityAccessService.configureBulkActivities(
              selectedUserId,
              module.id,
              { activities: changedActivities }
            );
          }
        });

      await Promise.all(activityPromises.filter(Boolean));

      await fetchUserPermissions(selectedUserId);

      setHasChanges(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error("Erro ao salvar permissões:", err);
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else {
        setError(errorMessage || "Erro ao salvar permissões. Tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleModule = (moduleId: number, currentState: boolean) => {
    setLocalPermissions((prev) => ({
      ...prev,
      moduleEnabled: {
        ...prev.moduleEnabled,
        [moduleId]: !currentState,
      },
    }));
    setHasChanges(true);
  };

  const toggleActivity = (activityId: number, currentState: boolean) => {
    setLocalPermissions((prev) => ({
      ...prev,
      activityEnabled: {
        ...prev.activityEnabled,
        [activityId]: !currentState,
      },
    }));
    setHasChanges(true);
  };

  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const renderModuleIcon = (iconName?: string) => {
    const IconComponent = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Package;
    return <IconComponent className="w-5 h-5" />;
  };

  // Contagem de usuários por role
  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.EMPLOYEE]: 0,
      [UserRole.SUPPLIER]: 0,
    };
    users.forEach(user => {
      if (counts[user.role] !== undefined) {
        counts[user.role]++;
      }
    });
    return counts;
  }, [users]);

  // Filtro e paginação de usuários
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtro por role
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }

      // Filtro por busca
      const searchLower = userSearchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    });
  }, [users, userSearchTerm, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * userLimit;
    const endIndex = startIndex + userLimit;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, userPage, userLimit]);

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserSearchTerm(userSearchInput);
    setUserPage(1);
  };

  const handleRoleCardClick = (role: UserRole) => {
    if (roleFilter === role) {
      setRoleFilter("");
    } else {
      setRoleFilter(role);
    }
    setUserPage(1);
  };

  const handleUserPageChange = (newPage: number) => {
    setUserPage(newPage);
  };

  const handleUserLimitChange = (newLimit: number) => {
    setUserLimit(newLimit);
    setUserPage(1);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setUserPage(1);
  };

  // Filtro de módulos
  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (users.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-yellow-500 mr-4" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Atenção</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Nenhum usuário cadastrado no sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Erro</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Gerenciamento de Permissões</h1>
            <p className="text-gray-300 text-sm">
              Configure os acessos e atividades disponíveis para cada colaborador
            </p>
          </div>
          <Shield className="w-12 h-12 text-gray-600 opacity-50" />
        </div>
      </div>

      {/* Role Filter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLE_CARDS.map((card) => {
          const count = roleCounts[card.role] || 0;
          const isActive = roleFilter === card.role;
          const Icon = card.icon;

          return (
            <button
              key={card.role}
              onClick={() => handleRoleCardClick(card.role)}
              className={`bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${
                isActive
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200'
              }`}
            >
              <div className={`p-3 ${card.bgColor} ${card.textColor} rounded-lg`}>
                <Icon size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </div>
              {isActive && (
                <div className="ml-auto">
                  <CheckCircle2 size={20} className="text-primary-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* User Selection Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Selecione um Colaborador</h2>
            {selectedUser && (
              <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-200">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Usuário selecionado</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleUserSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou função..."
                value={userSearchInput}
                onChange={(e) => setUserSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Buscar
            </button>
            {(userSearchTerm || roleFilter) && (
              <button
                type="button"
                onClick={() => {
                  setUserSearchTerm('');
                  setUserSearchInput('');
                  setRoleFilter('');
                  setUserPage(1);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Limpar
              </button>
            )}
          </form>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Colaborador</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">Função</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedUsers && paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => {
                const isSelected = user.id === selectedUserId;
                return (
                  <tr
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary-50 border-l-4 border-l-primary-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? 'bg-primary-600 text-white ring-2 ring-primary-200'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-medium truncate ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                            {user.name}
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1 text-xs text-primary-600 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Configurando permissões</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${isSelected ? 'text-primary-700 font-medium' : 'text-gray-600'}`}>
                        {user.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          isSelected
                            ? 'bg-primary-100 text-primary-700 border border-primary-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  {userSearchTerm ? 'Nenhum colaborador encontrado.' : 'Carregando colaboradores...'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <Pagination
            page={userPage}
            total={filteredUsers.length}
            limit={userLimit}
            onPageChange={handleUserPageChange}
            onLimitChange={handleUserLimitChange}
            className="rounded-b-xl border-t rounded-t-none"
          />
        )}
      </div>

      {/* Summary Stats */}
      {userAccessStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Módulos</p>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {userAccessStatus.summary.enabledModules}
              <span className="text-base text-gray-400 font-normal">
                /{userAccessStatus.summary.totalModules}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">ativos</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Atividades</p>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {userAccessStatus.summary.activeActivities}
              <span className="text-base text-gray-400 font-normal">
                /{userAccessStatus.summary.totalActivities}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">configuradas</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Utilização</p>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {userAccessStatus.summary.totalModules > 0
                ? Math.round(
                  (userAccessStatus.summary.enabledModules /
                    userAccessStatus.summary.totalModules) *
                  100
                )
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">dos recursos</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</p>
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-emerald-600 flex items-center mt-1">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Ativo
            </p>
            <p className="text-xs text-gray-500 mt-1">sistema operacional</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Permissions List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredModules.map((module, idx) => {
            const isModuleEnabled = localPermissions.moduleEnabled[module.id] ?? false;
            const isExpanded = expandedModules[module.id] ?? false;
            const moduleActivities = activities.filter((a) => a.moduleId === module.id);
            const activeCount = moduleActivities.filter(
              (a) => localPermissions.activityEnabled[a.id] || a.isMandatory
            ).length;

            return (
              <div key={module.id} className={`transition-colors ${isModuleEnabled ? 'bg-white' : 'bg-gray-50/50'}`}>
                {/* Module Header */}
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                  {/* Toggle Module */}
                  <button
                    onClick={() => toggleModule(module.id, isModuleEnabled)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0
                      ${isModuleEnabled ? "bg-primary-600" : "bg-gray-300"}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                        ${isModuleEnabled ? "translate-x-6" : "translate-x-1"}
                      `}
                    />
                  </button>

                  {/* Icon */}
                  <div
                    className={`p-2.5 rounded-lg flex-shrink-0 ${isModuleEnabled
                      ? "bg-primary-100 text-primary-600"
                      : "bg-gray-200 text-gray-500"
                      }`}
                  >
                    {renderModuleIcon(module.name)}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base ${isModuleEnabled ? "text-gray-900" : "text-gray-500"}`}>
                      {module.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isModuleEnabled ? (
                        <>
                          <span className="font-semibold text-primary-600">{activeCount}</span>
                          {" de "}
                          <span className="font-semibold">{moduleActivities.length}</span>
                          {" atividades ativas"}
                        </>
                      ) : (
                        "Módulo desabilitado"
                      )}
                    </p>
                  </div>

                  {/* Status Badge */}
                  {isModuleEnabled && (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Ativo
                    </div>
                  )}

                  {/* Expand Button */}
                  {isModuleEnabled && moduleActivities.length > 0 && (
                    <button
                      onClick={() => toggleModuleExpansion(module.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* Activities List (Expandable) */}
                {isModuleEnabled && isExpanded && moduleActivities.length > 0 && (
                  <div className="bg-gray-50/50 border-t border-gray-100">
                    <div className="px-4 py-3">
                      <div className="space-y-2 ml-16">
                        {moduleActivities.map((activity) => {
                          const isActivityEnabled =
                            localPermissions.activityEnabled[activity.id] ?? false;

                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
                            >
                              <div className="flex h-5 items-center">
                                <input
                                  id={`perm-${activity.id}`}
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  checked={isActivityEnabled || activity.isMandatory}
                                  disabled={activity.isMandatory}
                                  onChange={() =>
                                    toggleActivity(activity.id, isActivityEnabled)
                                  }
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <label
                                  htmlFor={`perm-${activity.id}`}
                                  className="font-medium text-sm text-gray-900 cursor-pointer select-none flex items-center gap-2"
                                >
                                  {activity.name}
                                  {activity.isMandatory && (
                                    <span
                                      title="Permissão obrigatória"
                                      className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
                                    >
                                      <Lock className="w-3 h-3" />
                                      Obrigatória
                                    </span>
                                  )}
                                </label>

                                {activity.permissions && activity.permissions.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                    {activity.permissions.map((perm) => (
                                      <span
                                        key={perm.id}
                                        className="text-[10px] text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200"
                                      >
                                        {perm.key}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State for Disabled Module */}
                {!isModuleEnabled && (
                  <div className="px-4 pb-4 ml-16">
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-100 px-4 py-3 rounded-lg">
                      <Shield className="w-4 h-4" />
                      <span>Habilite o módulo para configurar as atividades</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum módulo encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Tente ajustar os termos de busca</p>
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 flex items-center gap-4 z-50">
        {savedSuccess && (
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center animate-in fade-in slide-in-from-right-5 duration-300">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span className="font-medium">Permissões salvas com sucesso!</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`
            flex items-center px-6 py-3.5 rounded-xl font-bold shadow-xl transition-all transform hover:scale-105 active:scale-95
            ${hasChanges && !isSaving
              ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-primary-200"
              : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-gray-200"
            }
          `}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Alterações
              {hasChanges && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  Pendente
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}