import { IsOptional, IsString, Length } from "class-validator";

export class CreateContainerAgSupplierDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(11, 20)
  document?: string;
}
