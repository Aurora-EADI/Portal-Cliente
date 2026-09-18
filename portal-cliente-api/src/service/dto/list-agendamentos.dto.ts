import { Type } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListAgendamentosDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  excludeConcluido?: string;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsString()
  cnpjCliente?: string;

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  bootstrapCursorCreatedEm?: string;

  @IsOptional()
  @IsString()
  bootstrapCursorId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  bootstrapLimit?: number;
}
