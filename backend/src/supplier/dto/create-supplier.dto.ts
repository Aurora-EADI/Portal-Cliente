import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateSupplierDto {
  @IsNotEmpty({ message: "O nome é obrigatório." })
  name: string;

  @IsEmail({}, { message: "Informe um email válido." })
  email: string;

  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres." })
  password: string;

  @IsNotEmpty({ message: "O ID da empresa é obrigatório." })
  companyId: string; // fornecedor vinculado a uma empresa
}
