import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CompleteItemDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avarias?: string[];

  @IsOptional()
  @IsString()
  observacao?: string;
}

export class CompleteSideDto {
  @IsString()
  lado: string;

  @IsOptional()
  @IsBoolean()
  inspecionado?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteItemDto)
  itens?: CompleteItemDto[];
}

export class CompleteInspectionDto {
  @IsOptional()
  @IsString()
  inspectionStatus?: string;

  @IsOptional()
  @IsString()
  assinatura?: string;

  @IsOptional()
  @IsNumber()
  gpsLat?: number;

  @IsOptional()
  @IsNumber()
  gpsLng?: number;

  @IsOptional()
  @IsString()
  observacaoGeral?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteSideDto)
  lados?: CompleteSideDto[];

  @IsOptional()
  inspecao717?: unknown;

  @IsOptional()
  inspecao717Header?: unknown;
}
