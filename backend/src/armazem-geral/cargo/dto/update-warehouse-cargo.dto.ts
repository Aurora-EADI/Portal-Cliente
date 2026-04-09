import { IsArray, IsBoolean, IsDateString, IsInt, IsNumber, IsNumberString, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";

export class UpdateWarehouseCargoDto {
  @IsOptional()
  @IsString()
  @Length(2, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  cargoType?: string;

  @IsOptional()
  @IsString()
  weightKg?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  dangerous?: boolean;

  @IsOptional()
  @IsUUID()
  containerId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsOptional()
  @IsDateString()
  exitDate?: string;

  @IsOptional()
  @IsUUID()
  entryContainerId?: string;

  @IsOptional()
  @IsUUID()
  exitContainerId?: string;

  @IsOptional()
  @IsString()
  packagingType?: string;

  @IsOptional()
  @IsNumber()
  volume?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  cifValue?: number;

  @IsOptional()
  @IsArray()
  documents?: any[];
}
