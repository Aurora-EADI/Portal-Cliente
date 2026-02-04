import { IsOptional, IsEmail, MinLength } from "class-validator";

export class UpdateSupplierDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: "Informe um email válido." })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres." })
  password?: string;
}
