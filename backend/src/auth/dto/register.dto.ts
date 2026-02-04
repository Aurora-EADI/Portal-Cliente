import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO para dados da empresa durante o registro
 * Valida todos os campos obrigatórios do cadastro empresarial
 */
export class RegisterCompanyDto {
  @ApiProperty({
    description: "CNPJ da empresa",
    example: "12.345.678/0001-90",
  })
  @IsString({ message: "CNPJ deve ser uma string" })
  @IsNotEmpty({ message: "CNPJ é obrigatório" })
  @Matches(/^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14})$/, {
    message: "CNPJ deve conter 14 dígitos (com ou sem formatação)",
  })
  cnpj: string;

  @ApiProperty({
    description: "Nome fantasia da empresa",
    example: "Empresa XYZ",
  })
  @IsString()
  @IsNotEmpty({ message: "Nome fantasia é obrigatório" })
  fantasyName: string;

  @ApiProperty({
    description: "Razão social da empresa",
    example: "Empresa XYZ LTDA",
  })
  @IsString()
  @IsNotEmpty({ message: "Razão social é obrigatória" })
  socialReason: string;

  @ApiProperty({ description: "CEP", example: "12345-678" })
  @IsString()
  @IsNotEmpty({ message: "CEP é obrigatório" })
  zipCode: string;

  @ApiProperty({ description: "Endereço", example: "Rua das Flores" })
  @IsString()
  @IsNotEmpty({ message: "Endereço é obrigatório" })
  address: string;

  @ApiProperty({ description: "Número", example: "123" })
  @IsString()
  @IsNotEmpty({ message: "Número é obrigatório" })
  number: string;

  @ApiProperty({
    description: "Complemento",
    example: "Sala 101",
    required: false,
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({ description: "Bairro", example: "Centro" })
  @IsString()
  @IsNotEmpty({ message: "Bairro é obrigatório" })
  neighborhood: string;

  @ApiProperty({ description: "Cidade", example: "São Paulo" })
  @IsString()
  @IsNotEmpty({ message: "Cidade é obrigatória" })
  city: string;

  @ApiProperty({ description: "Estado (UF)", example: "SP" })
  @IsString()
  @IsNotEmpty({ message: "Estado é obrigatório" })
  @MinLength(2, { message: "Estado deve ter 2 caracteres" })
  state: string;

  @ApiProperty({ description: "Telefone", example: "(11) 98765-4321" })
  @IsString()
  @IsNotEmpty({ message: "Telefone é obrigatório" })
  phone: string;
}

/**
 * DTO para dados do usuário durante o registro
 */
export class RegisterUserDto {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João Silva",
  })
  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  name: string;

  @ApiProperty({ description: "Email do usuário", example: "joao@empresa.com" })
  @IsEmail({}, { message: "Email inválido" })
  @IsNotEmpty({ message: "Email é obrigatório" })
  email: string;

  @ApiProperty({
    description: "Senha (mínimo 6 caracteres)",
    example: "senha123",
  })
  @IsString()
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve ter no mínimo 6 caracteres" })
  password: string;
}

/**
 * DTO principal para registro completo
 * Combina dados da empresa e do usuário responsável
 */
export class RegisterDto {
  @ApiProperty({ description: "ID da empresa (opcional)", required: false })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiProperty({ description: "Dados da empresa", type: RegisterCompanyDto })
  @IsNotEmpty({ message: "Dados da empresa são obrigatórios" })
  company: RegisterCompanyDto;

  @ApiProperty({
    description: "Dados do usuário responsável",
    type: RegisterUserDto,
  })
  @IsNotEmpty({ message: "Dados do usuário são obrigatórios" })
  user: RegisterUserDto;
}
