import { IsOptional, IsString, Length } from "class-validator";

export class ResolveDamageDto {
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  resolutionNotes?: string;
}
