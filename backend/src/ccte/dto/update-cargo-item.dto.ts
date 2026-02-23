import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { TCOption, CargoItemStatus, WarehouseReason } from '@prisma/client';

export class UpdateCargoItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  house?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  importer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dta?: string;


  @ApiProperty({ required: false, enum: TCOption })
  @IsOptional()
  @IsEnum(TCOption)
  tc?: TCOption;

  @ApiProperty({ required: false, enum: WarehouseReason })
  @IsOptional()
  @IsEnum(WarehouseReason)
  warehouseReason?: WarehouseReason;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responsible?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  sent?: boolean;

  @ApiProperty({ required: false, enum: CargoItemStatus })
  @IsOptional()
  @IsEnum(CargoItemStatus)
  status?: CargoItemStatus;
}
