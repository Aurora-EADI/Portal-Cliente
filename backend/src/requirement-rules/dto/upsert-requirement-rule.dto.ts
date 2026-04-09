import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import {
  AllocationRegime,
  CompanyClassification,
} from "@prisma/client";

class RuleDocumentItemDto {
  @Type(() => Number)
  @IsNotEmpty()
  documentTypeId: number;

  @IsBoolean()
  isRequired: boolean;
}

export class UpsertRequirementRuleDto {
  @IsEnum(CompanyClassification)
  companyClassification: CompanyClassification;

  @IsEnum(AllocationRegime)
  allocationRegime: AllocationRegime;

  @IsString()
  @IsNotEmpty({ message: "supplierTypeId é obrigatório" })
  supplierTypeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleDocumentItemDto)
  items: RuleDocumentItemDto[];

  @IsBoolean()
  active: boolean;
}


