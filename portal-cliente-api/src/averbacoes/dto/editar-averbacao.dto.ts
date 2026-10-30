import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { MAX_CONTAINERS } from '../../common/containers';
import {
  DOCUMENTO_SAIDA_MENSAGEM,
  DOCUMENTO_SAIDA_REGEX,
  normalizarDocumentoSaida,
} from './documento-saida';

/**
 * Correção de um processo aberto por engano no cadastro.
 *
 * Todos os campos são opcionais — envia-se só o que muda. A modalidade e o
 * cliente ficam de fora de propósito: a modalidade define quais documentos
 * foram materializados na abertura, e trocá-la invalidaria a lista já enviada;
 * o cliente define de qual procuração o processo depende. Mudar qualquer um
 * dos dois é abrir outro processo, não corrigir este.
 *
 * As regras de formato são as mesmas de `CriarAverbacaoDto`, deliberadamente
 * repetidas em vez de herdadas: aqui todo campo é opcional, e um `PartialType`
 * traria junto `modalidade` e `clienteId`, que não podem ser editados.
 */
export class EditarAverbacaoDto {
  @IsOptional()
  @Transform(({ value }) => normalizarDocumentoSaida(value))
  @IsString()
  @Matches(DOCUMENTO_SAIDA_REGEX, { message: DOCUMENTO_SAIDA_MENSAGEM })
  diDuimp?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '') : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Container/Conhecimento aceita apenas letras e números',
  })
  containerConhecimento?: string;

  /** Substitui a lista inteira: corrigir é redeclarar o que a carga tem. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_CONTAINERS)
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) =>
          typeof v === 'string' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v,
        )
      : value,
  )
  @IsString({ each: true })
  @Matches(/^[A-Z0-9]+$/, {
    each: true,
    message: 'Container aceita apenas letras e números',
  })
  containers?: string[];

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  localOrigem?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  recintoDestino?: string;

  @IsOptional()
  @IsBoolean()
  cargaEspecial?: boolean;
}
