import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Nome do documento', example: 'Contrato 2024' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'ID da empresa', required: false })
  @IsString()
  @IsOptional()
  companyId: string;

  @ApiProperty({ description: 'Data de emissão', example: '2024-01-15', required: false })
  @IsString()
  @IsOptional()
  dateIssue?: string;

  @ApiProperty({ description: 'Data de expiração', example: '2024-12-31', required: false })
  @IsString()
  @IsOptional()
  dateExpiration?: string;

  @ApiProperty({ description: 'ID do tipo de documento', required: false })
  @IsString()
  @IsOptional()
  documentTypeId?: string;
}
