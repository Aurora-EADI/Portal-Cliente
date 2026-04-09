import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import {
  AllocationRegime,
  CompanyClassification,
} from "@prisma/client";

class WorkforceEmployeeInputDto {
  @ApiProperty({ description: "Nome completo do colaborador", example: "Joao Silva" })
  @IsString()
  @IsNotEmpty({ message: "Nome completo e obrigatorio" })
  fullName: string;

  @ApiProperty({ description: "CPF do colaborador", example: "12345678901" })
  @IsString()
  @IsNotEmpty({ message: "CPF e obrigatorio" })
  cpf: string;

  @ApiProperty({ description: "Funcao do colaborador", example: "Conferente" })
  @IsString()
  @IsNotEmpty({ message: "Funcao e obrigatoria" })
  position: string;

  @ApiProperty({ description: "Data de admissao", example: "2026-02-16" })
  @IsDateString()
  @IsNotEmpty({ message: "Data de admissao e obrigatoria" })
  hiredAt: string;
}

export class RequestAccessCompanyDto {
  @ApiProperty({
    description: "CNPJ da empresa",
    example: "12.345.678/0001-90",
  })
  @IsString({ message: "CNPJ deve ser uma string" })
  @IsNotEmpty({ message: "CNPJ e obrigatorio" })
  @Matches(
    /^([A-Z0-9]{2}\.?[A-Z0-9]{3}\.?[A-Z0-9]{3}\/?[0-9]{4}-?[0-9]{2}|[A-Z0-9]{12}[0-9]{2})$/i,
    {
      message: "CNPJ deve conter 14 caracteres alfanumericos (com ou sem formatacao)",
    },
  )
  cnpj: string;

  @ApiProperty({
    description: "Nome fantasia da empresa",
    example: "Empresa XYZ",
  })
  @IsString()
  @IsNotEmpty({ message: "Nome fantasia e obrigatorio" })
  fantasyName: string;

  @ApiProperty({
    description: "Razao social da empresa",
    example: "Empresa XYZ LTDA",
  })
  @IsString()
  @IsNotEmpty({ message: "Razao social e obrigatoria" })
  socialReason: string;

  @ApiProperty({ description: "CEP", example: "12345-678" })
  @IsString()
  @IsNotEmpty({ message: "CEP e obrigatorio" })
  zipCode: string;

  @ApiProperty({ description: "Endereco", example: "Rua das Flores" })
  @IsString()
  @IsNotEmpty({ message: "Endereco e obrigatorio" })
  address: string;

  @ApiProperty({ description: "Numero", example: "123" })
  @IsString()
  @IsNotEmpty({ message: "Numero e obrigatorio" })
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
  @IsNotEmpty({ message: "Bairro e obrigatorio" })
  neighborhood: string;

  @ApiProperty({ description: "Cidade", example: "Sao Paulo" })
  @IsString()
  @IsNotEmpty({ message: "Cidade e obrigatoria" })
  city: string;

  @ApiProperty({ description: "Estado (UF)", example: "SP" })
  @IsString()
  @IsNotEmpty({ message: "Estado e obrigatorio" })
  @MinLength(2, { message: "Estado deve ter 2 caracteres" })
  state: string;

  @ApiProperty({ description: "Telefone", example: "(11) 98765-4321" })
  @IsString()
  @IsNotEmpty({ message: "Telefone e obrigatorio" })
  phone: string;

  @ApiProperty({
    description: "Classificacao da empresa",
    required: false,
    enum: CompanyClassification,
  })
  @IsOptional()
  @IsEnum(CompanyClassification)
  classification?: CompanyClassification;

  @ApiProperty({
    description: "Regime de alocacao de mao de obra",
    required: false,
    enum: AllocationRegime,
  })
  @IsOptional()
  @IsEnum(AllocationRegime)
  allocationRegime?: AllocationRegime;

  @ApiProperty({
    description: "Tipos de fornecedor selecionados",
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supplierTypeIds?: string[];

  @ApiProperty({
    description: "Colaboradores terceirizados da empresa",
    required: false,
    type: [WorkforceEmployeeInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkforceEmployeeInputDto)
  workforceEmployees?: WorkforceEmployeeInputDto[];
}

export class RequestAccessUserDto {
  @ApiProperty({
    description: "Nome completo do usuario",
    example: "Joao Silva",
  })
  @IsString()
  @IsNotEmpty({ message: "Nome e obrigatorio" })
  name: string;

  @ApiProperty({ description: "Email do usuario", example: "joao@empresa.com" })
  @IsEmail({}, { message: "Email invalido" })
  @IsNotEmpty({ message: "Email e obrigatorio" })
  email: string;

  @ApiProperty({
    description: "Senha (minimo 6 caracteres)",
    example: "senha123",
  })
  @IsString()
  @IsNotEmpty({ message: "Senha e obrigatoria" })
  @MinLength(6, { message: "Senha deve ter no minimo 6 caracteres" })
  password: string;
}

export class RequestAccessDto {
  @ApiProperty({
    description: "Dados da empresa",
    type: RequestAccessCompanyDto,
  })
  @ValidateNested()
  @Type(() => RequestAccessCompanyDto)
  @IsNotEmpty({ message: "Dados da empresa sao obrigatorios" })
  company: RequestAccessCompanyDto;

  @ApiProperty({ description: "Dados do usuario", type: RequestAccessUserDto })
  @ValidateNested()
  @Type(() => RequestAccessUserDto)
  @IsNotEmpty({ message: "Dados do usuario sao obrigatorios" })
  user: RequestAccessUserDto;
}

