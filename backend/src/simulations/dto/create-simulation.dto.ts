import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AddSimulationServiceDto } from "./add-simulation-service.dto";

export class CreateSimulationDto {
  @IsString()
  customerId: string;

  // Dados da carga
  @IsNumber()
  @Type(() => Number)
  cifUsd: number;

  @IsNumber()
  @Type(() => Number)
  dollarRate: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tonnes?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  cntrCount?: number;

  @IsOptional()
  @IsString()
  cntrType?: string; // "20" ou "40"

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storageCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  transportCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount?: number;

  @IsOptional()
  @IsBoolean()
  hasStripping?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLcl?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minBillingValue?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  auroraPeriods?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddSimulationServiceDto)
  initialServices?: any[];
}
