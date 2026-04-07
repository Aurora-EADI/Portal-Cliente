import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransportadoraDto {
  @ApiProperty({ description: 'Razão social ou nome da transportadora' })
  @IsString()
  @IsNotEmpty({ message: 'O nome da transportadora é obrigatório' })
  name: string;

  @ApiProperty({ description: 'CNPJ da transportadora (opcional)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'O CNPJ deve estar no formato 00.000.000/0000-00',
  })
  cnpj?: string;
}
