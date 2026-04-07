import { IsOptional, IsString, Length } from "class-validator";

export class CompleteTransshipmentDto {
  @IsOptional()
  @IsString()
  @Length(1, 40)
  newSeal?: string;

  @IsOptional()
  @IsString()
  responsibleName?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
