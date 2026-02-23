import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  ValidateNested,
} from "class-validator";

class WorkforceRequirementItemDto {
  @Type(() => Number)
  @IsInt()
  documentTypeId: number;

  @IsBoolean()
  isRequired: boolean;
}

export class UpdateWorkforceRequirementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkforceRequirementItemDto)
  requirements: WorkforceRequirementItemDto[];
}
