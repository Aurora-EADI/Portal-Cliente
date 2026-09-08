import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RejeitarDocumentoDto {
  /** Obrigatório: é o que o Despachante lê para saber o que reenviar. */
  @IsString()
  @MinLength(5, { message: 'Descreva o motivo da rejeição (mínimo 5 caracteres)' })
  @MaxLength(1000)
  motivo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  analisadoPor?: string;
}

export class AprovarDocumentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  analisadoPor?: string;
}

export class LiberarProcessoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  analisadoPor?: string;

  /** Lote do SIAUM a que o processo passa a corresponder. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  nLote?: string;
}
