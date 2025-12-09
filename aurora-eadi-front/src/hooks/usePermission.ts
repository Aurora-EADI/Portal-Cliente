import { useModuleAccess } from './useModuleAccess';

interface UsePermissionResult {
  hasPermission: boolean;
  isLoading: boolean;
}

/**
 * Hook para verificar se o usuário tem uma permissão específica
 * @param moduleRoute - Rota do módulo (ex: /faturamento)
 * @param permissionKey - Chave da permissão (ex: FAT_VIEW_CUTOFF)
 * @returns hasPermission e isLoading
 *
 * @example
 * const { hasPermission } = usePermission('/faturamento', 'FAT_VIEW_CUTOFF');
 *
 * return (
 *   <div>
 *     {hasPermission && <CutoffReportButton />}
 *   </div>
 * );
 */
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
