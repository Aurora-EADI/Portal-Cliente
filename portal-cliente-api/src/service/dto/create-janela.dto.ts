import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/** Payload de POST /service/janelas vindo do Aurora (`createJanela`). */
export class CreateJanelaDto {
  @IsString() descricao!: string;
  @IsString() horaInicio!: string;
  @IsString() horaFim!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  intervaloMinutos?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  vagasSimultaneas?: number;
}
