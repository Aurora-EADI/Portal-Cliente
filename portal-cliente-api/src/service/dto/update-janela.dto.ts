import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Patch de PATCH /service/janelas/:id. Antes o service fazia `data: body` —
 * spread cru do corpo direto no Prisma update (mass assignment: o chamador
 * escrevia qualquer coluna). Agora só os campos editáveis passam.
 */
export class UpdateJanelaDto {
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() horaInicio?: string;
  @IsOptional() @IsString() horaFim?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  intervaloMinutos?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  vagasSimultaneas?: number;
}
