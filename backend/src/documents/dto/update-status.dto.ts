import { IsEnum, IsString, IsOptional } from 'class-validator';
  import { DocumentStatus } from '@prisma/client-postgres';

  export class UpdateStatusDto {
    @IsEnum(DocumentStatus)
    status: DocumentStatus;

    @IsString()
    @IsOptional()
    rejectionReason?: string;
  }
