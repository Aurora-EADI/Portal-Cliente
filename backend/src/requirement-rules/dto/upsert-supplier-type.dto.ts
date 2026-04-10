import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpsertSupplierTypeDto {
  @IsString()
  @IsNotEmpty({ message: "Nome do tipo de fornecedor é obrigatório" })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
