import { IsString, IsNumber, IsOptional, IsDateString } from "class-validator";
import { Type } from "class-transformer";

export class CreateServiceCostDto {
  @IsString()
  serviceId: string;

  @IsNumber()
  @Type(() => Number)
  cost: number; // Custo em reais

  @IsOptional()
  @IsDateString()
  validFrom?: string; // ISO string, default: now

  @IsOptional()
  @IsDateString()
  validUntil?: string; // ISO string, null = vigente

  @IsOptional()
  @IsString()
  reason?: string; // Motivo da alteração
}
