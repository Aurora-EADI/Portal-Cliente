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
