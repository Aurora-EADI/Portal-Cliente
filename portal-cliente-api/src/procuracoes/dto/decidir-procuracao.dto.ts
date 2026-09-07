import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ProcuracaoStatus } from '@prisma/client';

export class ReprovarProcuracaoDto {
  /**
   * Obrigatório: é o texto que o Despachante lê para saber o que corrigir.
   * Reprovar sem motivo deixaria a pessoa reenviando o mesmo documento.
   */
  @IsString()
  @MinLength(5, { message: 'Descreva o motivo da recusa (mínimo 5 caracteres)' })
  @MaxLength(1000)
  motivo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  analisadoPor?: string;
}

export class AprovarProcuracaoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  analisadoPor?: string;
}

export class ListarProcuracoesServiceDto {
  @IsOptional()
  @IsEnum(ProcuracaoStatus)
  status?: ProcuracaoStatus;
}
