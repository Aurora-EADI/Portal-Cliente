import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';

export class CreateContainerDto {
  @ApiProperty({ example: 'MSCU1234567' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: '40HC' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ example: ['MSCUBR123456789', 'MSCUBR987654321'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  bls: string[];
}

export class CreateProcessoDto {
  @ApiProperty({ example: '01234/567-8' })
  @IsString()
  @IsNotEmpty()
  dta: string;

  @ApiProperty({ example: 'EMPRESA XYZ LTDA' })
  @IsString()
  @IsNotEmpty()
  empresa: string;

  @ApiProperty({ example: 'Chibatão' })
  @IsString()
  @IsNotEmpty()
  porto: string;

  @ApiProperty({ example: 'MSC ANNA' })
  @IsString()
  @IsNotEmpty()
  navio: string;

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

  @ApiProperty({ type: [CreateContainerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateContainerDto)
  containers: CreateContainerDto[];
}
