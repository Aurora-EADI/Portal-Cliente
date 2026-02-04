import { PartialType, OmitType } from "@nestjs/mapped-types";
import { CreateActivityDto } from "./create-activity.dto";

// Remove permissionIds do update básico (tem endpoint específico para isso)
export class UpdateActivityDto extends PartialType(
  OmitType(CreateActivityDto, ["permissionIds"] as const),
) {}

// ============================================================================
// 📁 ARQUIVO 4: src/activities/dto/update-activity-permissions.dto.ts
// ============================================================================

import { IsArray, ArrayMinSize, IsInt } from "class-validator";

export class UpdateActivityPermissionsDto {
  @IsArray({ message: "permissionIds deve ser um array" })
  @ArrayMinSize(1, { message: "Pelo menos uma permissão deve ser vinculada" })
  @IsInt({
    each: true,
    message: "Cada permissionId deve ser um número inteiro",
  })
  permissionIds: number[];
}
