import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty({ message: 'CNPJ não pode ser vazio' })
  @Length(14, 14, { message: 'CNPJ deve ter 14 caracteres (somente números)' })
  cnpj: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome fantasia não pode ser vazio' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  fantasyName: string;

  @IsString()
  @IsNotEmpty({ message: 'Razão social não pode ser vazia' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  socialReason: string;

  @IsString()
  @Length(8, 8, { message: 'CEP deve ter 8 caracteres (somente números)' })
  zipCode: string;

  @IsNotEmpty({ message: 'Endereço não pode ser vazio' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  address: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toUpperCase())
  complement?: string;

  @IsString()
  @IsNotEmpty({ message: 'Bairro não pode ser vazio' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  neighborhood: string;

  @IsString()
  @IsNotEmpty({ message: 'Cidade não pode ser vazia' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  city: string;

  @IsString()
  @Length(2, 2, { message: 'Estado deve conter 2 caracteres (UF)' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  state: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone não pode ser vazio' })
  phone: string;
}