import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserMobileRole } from "./create-mobile-user.dto";

export class UpdateMobileUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsEnum(UserMobileRole)
  @IsOptional()
  role?: UserMobileRole;
}
