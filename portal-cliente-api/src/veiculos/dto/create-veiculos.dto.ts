import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVeiculosDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  placa!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modelo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tipo!: string;
}
