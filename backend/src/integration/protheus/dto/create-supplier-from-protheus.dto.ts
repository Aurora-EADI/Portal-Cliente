import {
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
  IsDateString
} from 'class-validator';

export class CreateSupplierFromProtheusDto {
  // ===== COMPANY DATA =====

  @IsNotEmpty({ message: 'CNPJ é obrigatório' })
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'
  })
  cnpj: string;

  @IsNotEmpty({ message: 'Nome Fantasia é obrigatório' })
  @MinLength(3, { message: 'Nome Fantasia deve ter no mínimo 3 caracteres' })
  fantasyName: string;

  @IsNotEmpty({ message: 'Razão Social é obrigatória' })
  @MinLength(3, { message: 'Razão Social deve ter no mínimo 3 caracteres' })
  socialReason: string;

  @IsNotEmpty({ message: 'CEP é obrigatório' })
  zipCode: string;

  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  address: string;

  @IsNotEmpty({ message: 'Número é obrigatório' })
  number: string;

  @IsOptional()
  complement?: string;

  @IsNotEmpty({ message: 'Bairro é obrigatório' })
  neighborhood: string;

  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  city: string;

  @IsNotEmpty({ message: 'Estado é obrigatório' })
  @MinLength(2, { message: 'Estado deve ter 2 caracteres (UF)' })
  @MaxLength(2, { message: 'Estado deve ter 2 caracteres (UF)' })
  state: string;

  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;

  // ===== USER DATA =====

  @IsNotEmpty({ message: 'Nome do contato é obrigatório' })
  @MinLength(3, { message: 'Nome do contato deve ter no mínimo 3 caracteres' })
  contactName: string;

  @IsNotEmpty({ message: 'Email do contato é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  contactEmail: string;

  // ===== INTEGRATION METADATA =====

  @IsOptional()
  protheusCode?: string; // A2_COD

  @IsOptional()
  protheusLoja?: string; // A2_LOJA

  @IsOptional()
  @IsDateString({}, { message: 'Data de integração inválida' })
  integrationDate?: string;
}