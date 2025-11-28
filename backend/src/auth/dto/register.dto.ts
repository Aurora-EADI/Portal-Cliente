import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

/**
 * DTO para dados da empresa durante o registro
 * Valida todos os campos obrigatórios do cadastro empresarial
 */
export class RegisterCompanyDto {
  @IsString({ message: 'CNPJ deve ser uma string' })
  @IsNotEmpty({ message: 'CNPJ é obrigatório' })
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato 00.000.000/0000-00',
  })
  cnpj: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome fantasia é obrigatório' })
  fantasyName: string;

  @IsString()
  @IsNotEmpty({ message: 'Razão social é obrigatória' })
  socialReason: string;

  @IsString()
  @IsNotEmpty({ message: 'CEP é obrigatório' })
  zipCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'Número é obrigatório' })
  number: string;

  @IsString()
  @IsOptional() // Complemento é opcional
  complement?: string;

  @IsString()
  @IsNotEmpty({ message: 'Bairro é obrigatório' })
  neighborhood: string;

  @IsString()
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  @MinLength(2, { message: 'Estado deve ter 2 caracteres' })
  state: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;
}

/**
 * DTO para dados do usuário durante o registro
 */
export class RegisterUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}

/**
 * DTO principal para registro completo
 * Combina dados da empresa e do usuário responsável
 */
export class RegisterDto {
  @IsNotEmpty({ message: 'Dados da empresa são obrigatórios' })
  company: RegisterCompanyDto;

  @IsNotEmpty({ message: 'Dados do usuário são obrigatórios' })
  user: RegisterUserDto;
}
