"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

import { usersService } from "@/services/users/users.service";
import { modulesService } from "@/services/modules/modules.service";
import { activitiesService } from "@/services/activities/activities.service";
import { userModuleAccessService } from "@/services/access/user-module-access.service";
import { userActivityAccessService } from "@/services/access/user-activity-access.service";
import type { User } from "@/types/user";
import type { Module } from "@/types/module";
import type { Activity } from "@/types/activity";
import type { UserModulesAccessStatus } from "@/types/access-control";

// ==================== TYPES ====================

interface LocalPermissionState {
  moduleEnabled: Record<number, boolean>;
  activityEnabled: Record<number, boolean>;
}

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

      const [usersData, modulesData, activitiesData] = await Promise.all([
        usersService.findAll(),
        modulesService.findAll(),
        activitiesService.findAll(),
      ]);

      setUsers(usersData);
      setModules(modulesData);
      setActivities(activitiesData);

      if (usersData.length > 0) {
        setSelectedUserId(usersData[0].id);
      }
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

          // Só faz a requisição se houve mudança
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

      // Salva atividades alteradas para cada módulo habilitado
      const activityPromises = modules
        .filter((module) => localPermissions.moduleEnabled[module.id] ?? false)
        .map(async (module) => {
          const moduleActivities = activities.filter(
            (a) => a.moduleId === module.id
          );

          // Identifica as atividades que foram alteradas
          const changedActivities = moduleActivities
            .filter((activity) => {
              // Pula atividades obrigatórias (já são criadas automaticamente pelo backend)
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

          // Envia requisição bulk apenas se houver mudanças
          if (changedActivities.length > 0) {
            return userActivityAccessService.configureBulkActivities(
              selectedUserId,
              module.id,
              { activities: changedActivities }
            );
          }
        });

      await Promise.all(activityPromises.filter(Boolean));

      // Recarrega as permissões
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

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const renderModuleIcon = (iconName?: string) => {
    const IconComponent =
      iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Package;
    return <IconComponent className="w-5 h-5" />;
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
    <div className="space-y-8 pb-24">
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

      {/* User Selection Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Selecione o Colaborador
          </label>
          <div className="relative">
            <select
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-700 font-medium"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} - {u.role}
                </option>
              ))}
            </select>
            <UserIcon className="w-5 h-5 text-gray-500 absolute left-3 top-3.5 pointer-events-none" />
          </div>
        </div>

        {selectedUser && (
          <div className="flex items-center space-x-4 bg-primary-50 p-3 rounded-lg border border-primary-100">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg ring-2 ring-white">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{selectedUser.name}</p>
              <p className="text-xs text-primary-700 font-medium">
                {selectedUser.role}
              </p>
              <p className="text-xs text-gray-500">{selectedUser.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {userAccessStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Módulos Ativos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {userAccessStatus.summary.enabledModules}/
              {userAccessStatus.summary.totalModules}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Atividades Ativas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {userAccessStatus.summary.activeActivities}/
              {userAccessStatus.summary.totalActivities}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Taxa de Utilização</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {userAccessStatus.summary.totalModules > 0
                ? Math.round(
                  (userAccessStatus.summary.enabledModules /
                    userAccessStatus.summary.totalModules) *
                  100
                )
                : 0}
              %
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Status</p>
            <p className="text-sm font-bold text-green-600 mt-1 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Configurado
            </p>
          </div>
        </div>
      )}

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {modules.map((module) => {
          const isModuleEnabled =
            localPermissions.moduleEnabled[module.id] ?? false;
          const moduleActivities = activities.filter(
            (a) => a.moduleId === module.id
          );

          return (
            <div
              key={module.id}
              className={`
                  rounded-xl border transition-all duration-200
                  ${isModuleEnabled
                  ? "bg-white border-gray-300 shadow-sm"
                  : "bg-gray-50 border-gray-200 opacity-80"
                }
                `}
            >
              {/* Card Header with Toggle */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isModuleEnabled
                      ? "bg-primary-100 text-primary-600"
                      : "bg-gray-200 text-gray-500"
                      }`}
                  >
                    {renderModuleIcon(module.name)}
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-lg ${isModuleEnabled ? "text-gray-900" : "text-gray-500"
                        }`}
                    >
                      {module.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {moduleActivities.length} atividades disponíveis
                    </p>
                  </div>
                </div>

                {/* Module Master Toggle */}
                <button
                  onClick={() => toggleModule(module.id, isModuleEnabled)}
                  className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                      ${isModuleEnabled ? "bg-primary-600" : "bg-gray-300"}
                    `}
                >
                  <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${isModuleEnabled ? "translate-x-6" : "translate-x-1"}
                      `}
                  />
                </button>
              </div>

              {/* Activities List */}
              <div className="p-5">
                {isModuleEnabled ? (
                  <div className="space-y-3">
                    {moduleActivities.map((activity) => {
                      const isActivityEnabled =
                        localPermissions.activityEnabled[activity.id] ?? false;

                      return (
                        <div key={activity.id} className="flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              id={`perm-${activity.id}`}
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              checked={isActivityEnabled || activity.isMandatory}
                              disabled={activity.isMandatory}
                              onChange={() =>
                                toggleActivity(activity.id, isActivityEnabled)
                              }
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor={`perm-${activity.id}`}
                              className="font-medium text-gray-700 cursor-pointer select-none flex items-center gap-2"
                            >
                              {activity.name}
                              {activity.isMandatory && (
                                <span title="Permissão obrigatória">
                                  <Lock className="w-3 h-3 text-gray-400" />
                                </span>
                              )}
                            </label>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {activity.permissions?.map((perm) => (
                                <span
                                  key={perm.id}
                                  className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100"
                                >
                                  {perm.key}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {moduleActivities.length === 0 && (
                      <p className="text-sm text-gray-400 italic">
                        Nenhuma atividade vinculada a este módulo.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Acesso ao módulo desabilitado</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Action */}
      <div className="fixed bottom-6 right-6 flex items-center gap-4 z-50">
        {savedSuccess && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg flex items-center animate-in fade-in slide-in-from-right duration-300">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Permissões salvas com sucesso!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`
              flex items-center px-6 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105
              ${hasChanges && !isSaving
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
            </>
          )}
        </button>
      </div>
    </div>
  );
}