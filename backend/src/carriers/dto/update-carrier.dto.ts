import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

export class UpdateCarrierDto {
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(
    /^([A-Z0-9]{2}\.?[A-Z0-9]{3}\.?[A-Z0-9]{3}\/?[0-9]{4}-?[0-9]{2}|[A-Z0-9]{12}[0-9]{2})$/i,
    { message: 'CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-00 (alfanumérico)' },
  )
  cnpj?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

