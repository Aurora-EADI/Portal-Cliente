import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { TCOption, WarehouseReason } from '@prisma/client-postgres';

class CargoItemInput {
  @ApiProperty({ example: 'HAWB123456' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  house: string;

  @ApiProperty({ example: 'IMPORTADORA LTDA' })
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  importer: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dta?: string;


  @ApiProperty({ enum: TCOption, example: 'P' })
  @IsEnum(TCOption)
  tc: TCOption;

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
}

export class CreateCargoItemsDto {
  @ApiProperty({ type: [CargoItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargoItemInput)
  items: CargoItemInput[];
}
