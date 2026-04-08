import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

export class UpsertCarrierVehicleDto {
  @IsOptional()
  @IsString()
  @Length(36, 36)
  id?: string;

  @IsString()
  @Length(6, 12)
  plate!: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  type?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

