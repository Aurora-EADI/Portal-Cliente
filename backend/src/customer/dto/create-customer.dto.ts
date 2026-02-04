import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateCustomerDto {
  @IsNotEmpty({ message: "O código é obrigatório." })
  @IsString()
  code: string;

  @IsNotEmpty({ message: "O nome é obrigatório." })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  corporateName?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsNotEmpty({ message: 'O documento (CNPJ/CPF) é obrigatório.' })
  @IsString()
  document: string;
}
