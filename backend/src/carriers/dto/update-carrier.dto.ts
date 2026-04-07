import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

export class UpdateCarrierDto {
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  cnpj?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

