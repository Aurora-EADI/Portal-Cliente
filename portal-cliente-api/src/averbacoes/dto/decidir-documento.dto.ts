import { Transform } from 'class-transformer';
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

  /**
   * Lote do SIAUM, aceito aqui só por compatibilidade com o Aurora atual.
   *
   * O caminho correto é vincular antes, por PATCH /vinculo: o vínculo feito
   * dentro do `liberar` só podia ser gravado uma vez, porque liberar recusa
   * reexecução — processo liberado sem lote ficava permanentemente órfão.
   *
   * @deprecated usar VincularLoteDto antes de liberar.
   */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  nLote?: string;
}

export class VincularLoteDto {
  /**
   * Lote do SIAUM (doc_conhecimento.n_lote) — a chave única da operação lá.
   * Obrigatório: vincular sem lote não significa nada.
   */
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(1, { message: 'Informe o lote do SIAUM' })
  @MaxLength(60)
  nLote!: string;

  /** Quem confirmou o vínculo no Portal Aurora, para a trilha. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  vinculadoPor?: string;
}

export class DesvincularLoteDto {
  /**
   * Desvincular desfaz uma decisão de análise — sem o motivo registrado,
   * ninguém consegue depois explicar por que o vínculo mudou.
   */
  @IsString()
  @MinLength(5, { message: 'Descreva o motivo da desvinculação (mínimo 5 caracteres)' })
  @MaxLength(1000)
  motivo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vinculadoPor?: string;
}
