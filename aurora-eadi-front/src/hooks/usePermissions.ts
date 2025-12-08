import { useAuthContext } from '@/context/AuthContext';
import { useMemo } from 'react';

export function usePermissions() {
  const { userPermissions } = useAuthContext();

  const permissions = useMemo(() => {
    if (!userPermissions) return [];
    return userPermissions.permissions || [];
  }, [userPermissions]);

  // Verifica se tem uma permissão específica por key
  const hasPermission = (permissionKey: string): boolean => {
    return permissions.some((p) => p.key === permissionKey);
  };

  // Verifica se tem qualquer uma das permissões passadas
  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    return permissionKeys.some((key) => hasPermission(key));
  };

  // Verifica se tem todas as permissões passadas
  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    return permissionKeys.every((key) => hasPermission(key));
  };

  // Retorna todas as permission keys do usuário
  const getAllPermissionKeys = (): string[] => {
    return permissions.map((p) => p.key);
  };

  // Verifica se tem acesso a um módulo específico
  const hasModuleAccess = (moduleName: string): boolean => {
    return permissions.some((p) => p.moduleName === moduleName);
  };

  // Verifica se tem acesso a uma atividade específica
  const hasActivityAccess = (activityName: string): boolean => {
    return permissions.some((p) => p.activityName === activityName);
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getAllPermissionKeys,
    hasModuleAccess,
    hasActivityAccess,
    isLoading: !userPermissions,
  };
}
