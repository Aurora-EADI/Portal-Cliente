import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDriverDto {
  @ApiProperty({ description: "Nome completo do motorista" })
  @IsString()
  @IsNotEmpty({ message: "O nome do motorista é obrigatório" })
  name: string;

  @ApiProperty({ description: "CPF do motorista", required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: "O CPF deve estar no formato 000.000.000-00",
  })
  cpf?: string;

  @ApiProperty({ description: "Telefone do motorista", required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
