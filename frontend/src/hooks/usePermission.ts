import { useModuleAccess } from './useModuleAccess';

interface UsePermissionResult {
  hasPermission: boolean;
  isLoading: boolean;
}

export function usePermission(
  moduleRoute: string,
  permissionKey: string
): UsePermissionResult {
  const { module, isLoading } = useModuleAccess(moduleRoute);

  // Verifica se alguma atividade ativa contém a permissão
  const hasPermission = module?.activities?.some(
    (activity) =>
      activity.isActive &&
      activity.permissions?.includes(permissionKey)
  ) ?? false;

  return { hasPermission, isLoading };
}
