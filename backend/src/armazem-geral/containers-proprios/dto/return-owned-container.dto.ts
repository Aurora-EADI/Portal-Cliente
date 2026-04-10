import { IsOptional, IsString, Length } from "class-validator";

export class ReturnOwnedContainerDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  notes?: string;
}
