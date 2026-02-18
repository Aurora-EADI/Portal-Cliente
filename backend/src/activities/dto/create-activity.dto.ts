import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  MaxLength,
  IsOptional,
  Matches,
} from "class-validator";

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty({ message: "O nome da atividade é obrigatório" })
  @MaxLength(100, { message: "O nome deve ter no máximo 100 caracteres" })
  name: string;

  @IsInt({ message: "O ID do módulo deve ser um número inteiro" })
  @IsNotEmpty({ message: "O módulo é obrigatório" })
  moduleId: number;

  @IsBoolean({ message: "isMandatory deve ser true ou false" })
  @IsOptional()
  isMandatory?: boolean;

  @IsArray({ message: "permissionIds deve ser um array" })
  @ArrayMinSize(1, { message: "Pelo menos uma permissão deve ser vinculada" })
  @IsInt({
    each: true,
    message: "Cada permissionId deve ser um número inteiro",
  })
  permissionIds: number[];

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: "A rota deve ter no máximo 100 caracteres" })
  @Matches(/^\/[a-z0-9-]+(\/[a-z0-9-]+)*$/, {
    message:
      'A rota deve começar com "/" e conter apenas letras minúsculas, números e hífens (ex: /faturamento/cutoff)',
  })
  route?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: "O label deve ter no máximo 100 caracteres" })
  label?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, {
    message: "O nome do ícone deve ter no máximo 50 caracteres",
  })
  icon?: string;

  @IsInt({ message: "sortOrder deve ser um número inteiro" })
  @IsOptional()
  sortOrder?: number;
}
