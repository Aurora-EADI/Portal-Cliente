import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da atividade é obrigatório' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsInt({ message: 'O ID do módulo deve ser um número inteiro' })
  @IsNotEmpty({ message: 'O módulo é obrigatório' })
  moduleId: number;

  @IsBoolean({ message: 'isMandatory deve ser true ou false' })
  @IsOptional()
  isMandatory?: boolean;

  @IsArray({ message: 'permissionIds deve ser um array' })
  @ArrayMinSize(1, { message: 'Pelo menos uma permissão deve ser vinculada' })
  @IsInt({ each: true, message: 'Cada permissionId deve ser um número inteiro' })
  permissionIds: number[];
}