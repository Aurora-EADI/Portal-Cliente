import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProcessoDto {
  @ApiPropertyOptional({ example: '01234/567-8' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dta?: string;

  @ApiPropertyOptional({ example: 'EMPRESA XYZ LTDA' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  empresa?: string;

  @ApiPropertyOptional({ example: 'SANTOS' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  porto?: string;

  @ApiPropertyOptional({ example: 'MSC ANNA' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  navio?: string;

  @ApiPropertyOptional({ example: '2026-02-20' })
  @IsOptional()
  @IsDateString()
  ataDta?: string;

  @ApiPropertyOptional({ example: '2026-02-21' })
  @IsOptional()
  @IsDateString()
  ataMao?: string;

  @ApiPropertyOptional({ example: '2026-02-22' })
  @IsOptional()
  @IsDateString()
  ataEadi?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  conclusao?: string;

  @ApiPropertyOptional({ example: 'TRANSPORTADORA ABC' })
  @IsOptional()
  @IsString()
  transportador?: string;

  @ApiPropertyOptional({ example: 'COMISSARIA DEF' })
  @IsOptional()
  @IsString()
  comissaria?: string;

  @ApiPropertyOptional({ example: 50000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fobTotal?: number;

  @ApiPropertyOptional({ example: 3000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freteTotal?: number;

  @ApiPropertyOptional({ example: 53000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cifTotal?: number;
}
