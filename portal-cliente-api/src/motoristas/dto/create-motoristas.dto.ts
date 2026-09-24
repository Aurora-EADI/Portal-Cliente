import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMotoristasDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cnh!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telefone!: string;
}
