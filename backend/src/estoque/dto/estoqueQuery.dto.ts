import { IsOptional, IsDateString, IsString } from "class-validator";

export class EstoqueQueryDto {
  @IsOptional()
  @IsDateString()
  dt_inicio?: string;

  @IsOptional()
  @IsDateString()
  dt_fim?: string;

  @IsOptional()
  @IsString()
  n_lote?: string;

  @IsOptional()
  @IsString()
  cliente?: string;

  @IsOptional()
  @IsString()
  report_type?: string;
}
