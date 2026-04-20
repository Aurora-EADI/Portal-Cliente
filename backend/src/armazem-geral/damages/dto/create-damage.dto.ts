import { DamageSeverity } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from "class-validator";

export class CreateDamageDto {
  @IsEnum(DamageSeverity)
  severity!: DamageSeverity;

  @IsString()
  @Length(3, 2000)
  description!: string;

  @IsOptional()
  @IsUUID()
  containerId?: string;

  @IsOptional()
  @IsUUID()
  cargoId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoObjectKeys?: string[];
}
