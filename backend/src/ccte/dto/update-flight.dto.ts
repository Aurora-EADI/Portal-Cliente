import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateFlightDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  aircraftName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'arrivalTime deve estar no formato HH:mm',
  })
  arrivalTime?: string;

  @Transform(({ value }) => value?.toUpperCase())
  flightCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  termoEntrada?: string;

  @ApiProperty({
    description: 'Justificativa obrigatoria para edicao dos dados do voo',
  })
  @IsString()
  @IsNotEmpty({
    message: 'A justificativa e obrigatoria para realizar alteracoes',
  })
  reason: string;
}
