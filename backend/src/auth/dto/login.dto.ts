import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

/**
 * DTO para Login
 *
 * Valida as credenciais do usuário
 * Requer email, senha e o tipo de acesso (ADMIN ou SUPPLIER)
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;

  @IsEnum(UserRole, { message: 'Tipo de acesso inválido' })
  @IsNotEmpty({ message: 'Tipo de acesso é obrigatório' })
  role: UserRole;
}
