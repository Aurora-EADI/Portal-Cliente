import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterWithInviteDto {
  @IsString()
  @MinLength(1)
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsString()
  @MinLength(1)
  token: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
