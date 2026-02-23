import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import {
  AllocationRegime,
  CompanyClassification,
} from "@prisma/client";

export class UpdateCompanyProfileDto {
  @IsEnum(CompanyClassification)
  classification: CompanyClassification;

  @IsEnum(AllocationRegime)
  allocationRegime: AllocationRegime;

  @IsArray()
  @ArrayNotEmpty({ message: "Ao menos um tipo de fornecedor e obrigatorio" })
  @IsString({ each: true })
  supplierTypeIds: string[];
}

class WorkforceEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: "Nome completo e obrigatorio" })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: "CPF e obrigatorio" })
  cpf: string;

  @IsString()
  @IsNotEmpty({ message: "Funcao e obrigatoria" })
  position: string;

  @IsDateString()
  @IsNotEmpty({ message: "Data de admissao e obrigatoria" })
  hiredAt: string;

  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";
}

export class UpdateCompanyWorkforceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkforceEmployeeDto)
  employees: WorkforceEmployeeDto[];
}

