import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do módulo é obrigatório' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'A descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'A rota do módulo é obrigatória' })
  @MaxLength(100, { message: 'A rota deve ter no máximo 100 caracteres' })
  @Matches(/^\/[a-z0-9-]+$/, {
    message: 'A rota deve começar com "/" e conter apenas letras minúsculas, números e hífens (ex: /faturamento)',
  })
  route: string;

  @IsString()
  @IsNotEmpty({ message: 'O ícone do módulo é obrigatório' })
  @MaxLength(50, { message: 'O nome do ícone deve ter no máximo 50 caracteres' })
  icon: string;
}