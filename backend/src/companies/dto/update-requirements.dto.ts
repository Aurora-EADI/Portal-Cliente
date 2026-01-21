import { IsArray, ValidateNested, IsInt, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

class RequirementDto {
  @IsInt()
  documentTypeId: number;

  @IsBoolean()
  isRequired: boolean;
}

export class UpdateRequirementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequirementDto)
  requirements: RequirementDto[];
}
