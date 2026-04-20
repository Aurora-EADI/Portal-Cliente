import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UploadWorkforceDocumentDto {
  @ApiProperty({ description: "Nome do documento", example: "ASO Admissional" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "ID do colaborador terceirizado",
    example: "3f8b7d2e-53d1-4ce4-a24a-f0fd6c9c892f",
  })
  @IsString()
  @IsNotEmpty()
  companyEmployeeId: string;

  @ApiProperty({
    description: "Data de emissão",
    example: "2026-02-19",
    required: false,
  })
  @IsString()
  @IsOptional()
  dateIssue?: string;

  @ApiProperty({
    description: "Data de expiração",
    example: "2027-02-19",
    required: false,
  })
  @IsString()
  @IsOptional()
  dateExpiration?: string;

  @ApiProperty({ description: "ID do tipo de documento", required: false })
  @IsString()
  @IsOptional()
  documentTypeId?: string;
}
