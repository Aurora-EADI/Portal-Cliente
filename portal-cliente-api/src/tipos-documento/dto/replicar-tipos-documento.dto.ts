import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Modalidade } from '@prisma/client';

export class TipoDocumentoReplicadoDto {
  /** Id do registro no Portal Aurora — chave do upsert. */
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  auroraId!: string;

  @IsEnum(Modalidade)
  modalidade!: Modalidade;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  descricao!: string;

  @IsBoolean()
  obrigatorio!: boolean;

  @IsInt()
  @Min(1)
  @Max(3)
  step!: number;

  @IsBoolean()
  ativo!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}

export class ReplicarTiposDocumentoDto {
  // O Aurora manda o catálogo inteiro a cada escrita. O teto existe só para
  // limitar payload: o catálogo real tem dezenas de itens, não milhares.
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TipoDocumentoReplicadoDto)
  tipos!: TipoDocumentoReplicadoDto[];
}
