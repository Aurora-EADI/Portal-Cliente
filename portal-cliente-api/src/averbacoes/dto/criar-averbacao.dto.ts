import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { Modalidade } from '@prisma/client';

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

  // Normaliza antes de validar: o usuário digita em minúsculas e com espaço, e
  // recusar por isso seria atrito sem motivo. O que não dá para aceitar é
  // caractere fora de [A-Z0-9], que não existe em container nem conhecimento.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '') : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Container/Conhecimento aceita apenas letras e números',
  })
  containerConhecimento!: string;

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
