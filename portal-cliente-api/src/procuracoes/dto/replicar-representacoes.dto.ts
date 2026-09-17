import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * CNPJ ou CPF com máscara — o formato que o SIAUM grava e que `Cliente.cnpj`
 * já usa aqui. Normalizar de um lado só faria o mesmo cliente nascer duas vezes.
 */
const DOCUMENTO_COM_MASCARA =
  /^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;

export class RepresentacaoReplicadaDto {
  /** Código do despachante no SIAUM (D00175) — chave de `Despachante`. */
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  codDespachante!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nomeDespachante!: string;

  /** Documento do importador: CNPJ, ou CPF quando pessoa física. */
  @Matches(DOCUMENTO_COM_MASCARA, {
    message: 'documento deve ser CNPJ ou CPF com máscara',
  })
  documento!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nomeCliente!: string;

  @IsOptional()
  @IsDateString()
  ultimaDiEm?: string | null;
}

export class ReplicarRepresentacoesDto {
  // O Aurora pagina a carteira; o teto só limita o corpo de uma remessa.
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => RepresentacaoReplicadaDto)
  representacoes!: RepresentacaoReplicadaDto[];
}

export class ConcluirReplicacaoDto {
  /**
   * `sincronizadoEm` devolvido pela primeira remessa da execução. Vínculo não
   * marcado desde então saiu do estoque.
   */
  @IsDateString()
  desde!: string;
}
