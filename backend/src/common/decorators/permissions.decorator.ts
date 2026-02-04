import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";

/**
 * Decorator para proteger rotas com permissões específicas
 * @param permissions - Array de chaves de permissões necessárias (ex: 'FAT_VIEW_CUTOFF')
 * @example
 * @RequirePermissions('FAT_VIEW_CUTOFF', 'FAT_EXPORT_CUTOFF')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
