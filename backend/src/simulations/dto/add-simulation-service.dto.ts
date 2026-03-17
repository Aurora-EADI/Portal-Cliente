import { IsString, IsNumber, IsEnum, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { ServiceCostType } from "@prisma/client";

export class AddSimulationServiceDto {
  @IsString()
  serviceId: string;

  @IsEnum(ServiceCostType)
  costType: ServiceCostType; // DEFAULT, CUSTOM, ZEROED

  @IsNumber()
  @Type(() => Number)
  originalCost: number; // Custo original do serviÃ§o

  @IsNumber()
  @Type(() => Number)
  appliedCost: number; // Custo que serÃ¡ aplicado

  @IsOptional()
  @IsString()
  customReason?: string; // ObrigatÃ³rio se costType = CUSTOM
}

