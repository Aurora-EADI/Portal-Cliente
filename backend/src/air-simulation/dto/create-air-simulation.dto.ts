import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import { AddAirSimulationServiceDto } from "./add-air-simulation-service.dto";

export class CreateAirSimulationDto {
  @IsString()
  customerId: string;

  // Dados da carga aérea
  @IsNumber()
  @Type(() => Number)
  cifUsd: number;

  @IsNumber()
  @Type(() => Number)
  dollarRate: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weightKg?: number; // Peso bruto em KG

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  volumeM3?: number; // Volume em M³

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storageCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capataziaCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  transportCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minBillingValue?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  auroraPeriods?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  vinciPeriods?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddAirSimulationServiceDto)
  initialServices?: any[];
}
