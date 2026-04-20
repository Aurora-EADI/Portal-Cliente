import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

export class UpsertCarrierDriverDto {
  @IsOptional()
  @IsString()
  @Length(36, 36)
  id?: string;

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

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
