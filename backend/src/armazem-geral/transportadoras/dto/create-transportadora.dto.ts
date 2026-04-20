import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTransportadoraDto {
  @ApiProperty({ description: "Razão social ou nome da transportadora" })
  @IsString()
  @IsNotEmpty({ message: "O nome da transportadora é obrigatório" })
  name: string;

  @ApiProperty({
    description: "CNPJ da transportadora (opcional)",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(
    /^([A-Z0-9]{2}\.?[A-Z0-9]{3}\.?[A-Z0-9]{3}\/?[0-9]{4}-?[0-9]{2}|[A-Z0-9]{12}[0-9]{2})$/i,
    {
      message: "O CNPJ deve estar no formato XX.XXX.XXX/XXXX-00 (alfanumérico)",
    },
  )
  cnpj?: string;
}
