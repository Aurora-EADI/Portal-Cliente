import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { Modalidade } from '@prisma/client';
import { MAX_CONTAINERS } from '../../common/containers';
import {
  DOCUMENTO_SAIDA_MENSAGEM,
  DOCUMENTO_SAIDA_REGEX,
  normalizarDocumentoSaida,
} from './documento-saida';

export class CriarAverbacaoDto {
  @IsEnum(Modalidade)
  modalidade!: Modalidade;

  /** DI ou DUIMP — formatos em `documento-saida.ts`. */
  @Transform(({ value }) => normalizarDocumentoSaida(value))
  @IsString()
  @Matches(DOCUMENTO_SAIDA_REGEX, { message: DOCUMENTO_SAIDA_MENSAGEM })
  diDuimp!: string;

  /**
   * Forma antiga: um container ou conhecimento só.
   *
   * Continua aceita para o front que ainda não envia `containers` — a API pode
   * subir antes dele. O serviço normaliza os dois caminhos no mesmo lugar
   * (`resolverContainers`), que é quem valida ISO 6346 e a regra por
   * modalidade; aqui só barramos caractere que não existe em nenhum dos dois.
   */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '') : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Container/Conhecimento aceita apenas letras e números',
  })
  containerConhecimento?: string;

  /** Marítimo costuma ter mais de um container; as demais modalidades, um só. */
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

  @IsUUID()
  clienteId!: string;

  // Os três campos abaixo são informativos e opcionais: situam a carga para
  // quem analisa, mas nenhum muda a lista de documentos exigidos nem o gate de
  // liberação. Exigi-los travaria a abertura do processo por um dado que o
  // despachante nem sempre tem em mãos na hora.
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
