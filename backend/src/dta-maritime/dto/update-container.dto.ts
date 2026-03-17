import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateContainerDto {
  @ApiPropertyOptional({ example: 'MSCU1234567' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  number?: string;

  @ApiPropertyOptional({ example: '40HC' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tipo?: string;

  /**
   * Quando presente, substitui todos os BLs do container (replace-all).
   * Cada valor é sanitizado antes de persistir.
   */
  @ApiPropertyOptional({ example: ['MSCUBR123456789'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bls?: string[];
}
