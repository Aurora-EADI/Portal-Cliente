import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { AllocationRegime, CompanyClassification } from "@prisma/client";

class WorkforceEmployeeInputDto {
  @IsString()
  @IsNotEmpty({ message: "Nome completo nao pode ser vazio" })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: "CPF nao pode ser vazio" })
  cpf: string;

  @IsString()
  @IsNotEmpty({ message: "Funcao nao pode ser vazia" })
  position: string;

  @IsDateString()
  @IsNotEmpty({ message: "Data de admissao e obrigatoria" })
  hiredAt: string;
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty({ message: "CNPJ nao pode ser vazio" })
  @Matches(
    /^([A-Z0-9]{2}\.?[A-Z0-9]{3}\.?[A-Z0-9]{3}\/?[0-9]{4}-?[0-9]{2}|[A-Z0-9]{12}[0-9]{2})$/i,
    {
      message:
        "CNPJ deve conter 14 caracteres alfanumericos (com ou sem formatacao)",
    },
  )
  cnpj: string;

  @IsString()
  @IsNotEmpty({ message: "Nome fantasia nao pode ser vazio" })
  @Transform(({ value }) => value?.trim().toUpperCase())
  fantasyName: string;

  @IsString()
  @IsNotEmpty({ message: "Razao social nao pode ser vazia" })
  @Transform(({ value }) => value?.trim().toUpperCase())
  socialReason: string;

  @IsString()
  @Length(8, 8, { message: "CEP deve ter 8 caracteres (somente numeros)" })
  zipCode: string;

  @IsNotEmpty({ message: "Endereco nao pode ser vazio" })
  @Transform(({ value }) => value?.trim().toUpperCase())
  address: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toUpperCase())
  complement?: string;

  @IsString()
  @IsNotEmpty({ message: "Bairro nao pode ser vazio" })
  @Transform(({ value }) => value?.trim().toUpperCase())
  neighborhood: string;

  @IsString()
  @IsNotEmpty({ message: "Cidade nao pode ser vazia" })
  @Transform(({ value }) => value?.trim().toUpperCase())
  city: string;

  @IsString()
  @Length(2, 2, { message: "Estado deve conter 2 caracteres (UF)" })
  @Transform(({ value }) => value?.trim().toUpperCase())
  state: string;

  @IsString()
  @IsNotEmpty({ message: "Telefone nao pode ser vazio" })
  phone: string;

  @IsOptional()
  @IsEnum(CompanyClassification)
  classification?: CompanyClassification;

  @IsOptional()
  @IsEnum(AllocationRegime)
  allocationRegime?: AllocationRegime;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supplierTypeIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkforceEmployeeInputDto)
  workforceEmployees?: WorkforceEmployeeInputDto[];
}
