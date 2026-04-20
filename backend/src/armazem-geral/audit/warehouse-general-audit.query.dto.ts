import { AuditAction } from "@prisma/client";
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class WarehouseGeneralAuditQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsUUID()
  performedByUserId?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
