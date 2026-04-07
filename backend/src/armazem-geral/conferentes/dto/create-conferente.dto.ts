import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConferenteDto {
  @ApiProperty({ description: 'Nome completo do conferente' })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @ApiProperty({ description: 'Matrícula do conferente' })
  @IsString()
  @IsNotEmpty({ message: 'A matrícula é obrigatória' })
  matricula: string;

  @ApiProperty({ description: 'CPF do conferente' })
  @IsString()
  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'O CPF deve estar no formato 000.000.000-00',
  })
  cpf: string;
}
