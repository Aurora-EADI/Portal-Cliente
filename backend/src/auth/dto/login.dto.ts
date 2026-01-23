import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client-postgres';

/**
 * DTO para Login
 *
 * Valida as credenciais do usuário
 * Requer email, senha e o tipo de acesso (ADMIN ou SUPPLIER)
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@example.com'
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123'
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;

  @ApiProperty({
    description: 'Tipo de acesso do usuário',
    enum: UserRole,
    example: UserRole.SUPPLIER
  })
  @IsEnum(UserRole, { message: 'Tipo de acesso inválido' })
  @IsNotEmpty({ message: 'Tipo de acesso é obrigatório' })
  role: UserRole;
}
