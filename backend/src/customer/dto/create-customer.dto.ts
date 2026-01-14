import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'O código é obrigatório.' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'O documento (CNPJ/CPF) é obrigatório.' })
  @IsString()
  document: string;
}
