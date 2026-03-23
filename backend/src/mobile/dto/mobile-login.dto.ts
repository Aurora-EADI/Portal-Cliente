import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class MobileLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
