import { IsEmail, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

/**
 * DTO para Login
 *
 * Valida as credenciais do usuÃ¡rio
 * Requer email, senha e o tipo de acesso (ADMIN ou SUPPLIER)
 */
export class LoginDto {
  @ApiProperty({
    description: "Email do usuÃ¡rio",
    example: "usuario@example.com",
  })
  @IsEmail({}, { message: "Email invÃ¡lido" })
  @IsNotEmpty({ message: "Email Ã© obrigatÃ³rio" })
  email: string;

  @ApiProperty({
    description: "Senha do usuÃ¡rio",
    example: "senha123",
  })
  @IsNotEmpty({ message: "Senha Ã© obrigatÃ³ria" })
  password: string;

  @ApiProperty({
    description: "Tipo de acesso do usuÃ¡rio",
    enum: UserRole,
    example: UserRole.SUPPLIER,
  })
  @IsEnum(UserRole, { message: "Tipo de acesso invÃ¡lido" })
  @IsNotEmpty({ message: "Tipo de acesso Ã© obrigatÃ³rio" })
  role: UserRole;
}

