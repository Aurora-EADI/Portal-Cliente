import { IsString, IsNotEmpty, IsDateString, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateFlightDto {
  @ApiProperty({ example: 'BOEING 747 - DHL' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  aircraftName: string;

  @ApiProperty({ example: '2026-02-15' })
  @IsDateString()
  arrivalDate: string;

  @ApiProperty({ example: '14:30' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'arrivalTime deve estar no formato HH:mm' })
  arrivalTime: string;

  @ApiProperty({ example: '1234.AB' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  flightCode: string;

  @ApiProperty({ example: 'TERMO123' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  termoEntrada: string;
}
