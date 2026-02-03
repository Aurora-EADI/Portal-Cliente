import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  ArrayMinSize,
  IsInt,
} from "class-validator";

export class BulkAssignModulesDto {
  @IsArray({ message: "moduleIds deve ser um array" })
  @ArrayMinSize(1, { message: "Pelo menos um módulo deve ser informado" })
  @IsInt({ each: true, message: "Cada moduleId deve ser um número inteiro" })
  moduleIds: number[];

  @IsBoolean({ message: "isEnabled deve ser true ou false" })
  @IsNotEmpty({ message: "isEnabled é obrigatório" })
  isEnabled: boolean;
}
