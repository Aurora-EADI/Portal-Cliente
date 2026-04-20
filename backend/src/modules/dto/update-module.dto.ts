import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
  Matches,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { SubPageDto } from "./create-module.dto";

export class UpdateModuleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: "O nome deve ter no máximo 100 caracteres" })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: "A descrição deve ter no máximo 500 caracteres" })
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: "A rota deve ter no máximo 100 caracteres" })
  @Matches(/^\/[a-z0-9-]+$/, {
    message:
      'A rota deve começar com "/" e conter apenas letras minúsculas, números e hífens (ex: /faturamento)',
  })
  route?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, {
    message: "O nome do ícone deve ter no máximo 50 caracteres",
  })
  icon?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SubPageDto)
  subPages?: SubPageDto[];
}
