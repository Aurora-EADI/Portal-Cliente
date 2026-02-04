import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";
// Permite passar uma lista de permissões necessárias (ex: 'LOG_VIEW_FLEET')
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
