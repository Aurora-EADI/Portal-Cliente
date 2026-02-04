import { IsOptional, IsDateString } from "class-validator";

export class FaturamentoQueryDto {
  @IsOptional()
  @IsDateString()
  data_inicial?: string;

  @IsOptional()
  @IsDateString()
  data_final?: string;
}
