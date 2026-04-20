import { IsOptional, IsEmail, MinLength } from "class-validator";

export class UpdateAdminDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;
}
