import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsEmail,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty({ message: 'CNPJ não pode ser vazio' })
  @Length(14, 14, { message: 'CNPJ deve ter 14 caracteres (somente números)' })
  cnpj: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome fantasia não pode ser vazio' })
  fantasyName: string;

  @IsString()
  @IsNotEmpty({ message: 'Razão social não pode ser vazia' })
  socialReason: string;

  @IsString()
  @Length(8, 8, { message: 'CEP deve ter 8 caracteres (somente números)' })
  zipCode: string;

  @IsEmail({}, { message: 'Endereço deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'Endereço (email) não pode ser vazio' })
  address: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  @IsNotEmpty({ message: 'Bairro não pode ser vazio' })
  neighborhood: string;

  @IsString()
  @IsNotEmpty({ message: 'Cidade não pode ser vazia' })
  city: string;

  @IsString()
  @Length(2, 2, { message: 'Estado deve conter 2 caracteres (UF)' })
  state: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone não pode ser vazio' })
  phone: string;
}
