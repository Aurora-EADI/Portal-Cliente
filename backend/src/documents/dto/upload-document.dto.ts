import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

  export class UploadDocumentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    companyId: string;

    @IsString()
    @IsOptional()
    dateIssue?: string;

    @IsString()
    @IsOptional()
    dateExpiration?: string;
  }
