import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export enum UserMobileRole {
  INSPECTOR = "INSPECTOR",
  SUPERVISOR = "SUPERVISOR",
}

export class CreateMobileUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserMobileRole)
  @IsOptional()
  role?: UserMobileRole;
}
