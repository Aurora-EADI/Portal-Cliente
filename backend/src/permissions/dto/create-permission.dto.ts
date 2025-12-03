import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: 'A chave da permissão é obrigatória' })
  @Matches(/^[A-Z_]+$/, {
    message: 'A chave deve conter apenas letras maiúsculas e underscores (ex: LOG_VIEW_FLEET)',
  })
  @MaxLength(100, { message: 'A chave deve ter no máximo 100 caracteres' })
  key: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'A descrição deve ter no máximo 255 caracteres' })
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'A categoria deve ter no máximo 50 caracteres' })
  category?: string;
}