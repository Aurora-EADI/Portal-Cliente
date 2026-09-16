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

export class CriarAverbacaoDto {
  @IsEnum(Modalidade)
  modalidade!: Modalidade;

  /**
   * A spec pede `^\d{2}/\d{9}$`, mas nenhuma DI real do sistema casa com isso:
   * o formato em uso é 22/2564365-1 — dois dígitos, barra, sete dígitos, hífen
   * e dígito verificador. Aplicar a máscara da spec ao pé da letra recusaria
   * toda DI legítima já cadastrada.
   *
   * Aceita as duas formas: a real (com hífen) e a da spec, para o caso de
   * DUIMP sem verificador. Restringir só à real é uma linha, se preferirem.
   */
  @IsString()
  @Matches(/^\d{2}\/(\d{7}-\d|\d{9})$/, {
    message: 'DI/DUIMP deve estar no formato XX/XXXXXXX-X',
  })
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
