import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from "class-validator";
import { WarehouseOwnedContainerStatus } from "@prisma/client";

export class CreateContainerProprioDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  containerNumber?: string;

  @IsOptional()
  @IsString()
  containerType?: string;

  @IsOptional()
  @IsEnum(WarehouseOwnedContainerStatus)
  status?: WarehouseOwnedContainerStatus;

  @IsOptional()
  @IsBoolean()
  isFull?: boolean;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avarias?: string[];

  @IsOptional()
  @IsString()
  observations?: string;
}
