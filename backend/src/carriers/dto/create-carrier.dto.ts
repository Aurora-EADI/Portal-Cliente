import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateCarrierDriverDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  cpf?: string;

  @IsOptional()
  @IsString()
  @Length(8, 30)
  phone?: string;
}

export class CreateCarrierVehicleDto {
  @IsString()
  @Length(6, 12)
  plate!: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  type?: string;
}

export class CreateCarrierDto {
  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  cnpj?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateCarrierDriverDto)
  drivers?: CreateCarrierDriverDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateCarrierVehicleDto)
  vehicles?: CreateCarrierVehicleDto[];
}

