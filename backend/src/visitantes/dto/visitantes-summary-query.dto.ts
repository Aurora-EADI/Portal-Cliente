import { IsOptional, IsDateString } from 'class-validator';

export class VisitantesSummaryQueryDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
