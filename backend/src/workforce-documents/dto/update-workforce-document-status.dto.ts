import { ApiProperty } from "@nestjs/swagger";
import { DocumentStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateWorkforceDocumentStatusDto {
  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.APPROVED })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @ApiProperty({
    description: "Motivo da rejeiÃ§Ã£o (obrigatÃ³rio quando REJECTED)",
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

