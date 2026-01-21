import { IsString, IsEnum, IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { ServiceCostType } from "@prisma/client-postgres";

export class AddAirSimulationServiceDto {
  @IsString()
  serviceId: string;

  @IsEnum(ServiceCostType)
  costType: ServiceCostType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  originalCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appliedCost?: number;

  @IsOptional()
  @IsString()
  customReason?: string;
}
