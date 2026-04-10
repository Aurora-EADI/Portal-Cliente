import {
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
  IsDateString,
} from "class-validator";

export class CreateSupplierFromProtheusDto {
  // ===== COMPANY DATA =====

  @IsNotEmpty({ message: "CNPJ é obrigatório" })
  @Matches(
    /^([A-Z0-9]{2}\.?[A-Z0-9]{3}\.?[A-Z0-9]{3}\/?[0-9]{4}-?[0-9]{2}|[A-Z0-9]{12}[0-9]{2})$/i,
    {
      message:
        "CNPJ deve conter 14 caracteres alfanuméricos (com ou sem formatação)",
    },
  )
  cnpj: string;

  @IsNotEmpty({ message: "Nome Fantasia é obrigatório" })
  @MinLength(3, { message: "Nome Fantasia deve ter no mínimo 3 caracteres" })
  fantasyName: string;

  @IsNotEmpty({ message: "Razão Social é obrigatória" })
  @MinLength(3, { message: "Razão Social deve ter no mínimo 3 caracteres" })
  socialReason: string;

  @IsOptional()
  zipCode: string;

  @IsNotEmpty({ message: "Endereço é obrigatório" })
  address: string;

  @IsOptional()
  number: string;

  @IsOptional()
  complement?: string;

  @IsNotEmpty({ message: "Bairro é obrigatório" })
  neighborhood: string;

  @IsNotEmpty({ message: "Cidade é obrigatória" })
  city: string;

  @IsNotEmpty({ message: "Estado é obrigatório" })
  @MinLength(2, { message: "Estado deve ter 2 caracteres (UF)" })
  @MaxLength(2, { message: "Estado deve ter 2 caracteres (UF)" })
  state: string;

  @IsOptional()
  phone: string;

  // ===== USER DATA =====

  @IsNotEmpty({ message: "Nome do contato é obrigatório" })
  @MinLength(3, { message: "Nome do contato deve ter no mínimo 3 caracteres" })
  contactName: string;

  @IsOptional()
  contactEmail: string;

  // ===== INTEGRATION METADATA =====

  @IsOptional()
  protheusCode?: string; // A2_COD

  @IsOptional()
  protheusLoja?: string; // A2_LOJA

  @IsOptional()
  @IsDateString({}, { message: "Data de integração inválida" })
  integrationDate?: string;
}
