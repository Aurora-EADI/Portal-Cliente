import { IsEnum, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { TransshipmentReason } from "@prisma/client";

export class UpdateTransshipmentDto {
  @IsOptional()
  @IsString()
  @Length(1, 40)
  newSeal?: string;

  @IsOptional()
  @IsEnum(TransshipmentReason)
  reason?: TransshipmentReason;

  @IsOptional()
  @IsUUID()
  destinationContainerId?: string;

  @IsOptional()
  @IsString()
  destinationContainerNumber?: string;

  @IsOptional()
  @IsString()
  responsibleName?: string;

  @IsOptional()
  @IsString()
  responsibleMatricula?: string;

  @IsOptional()
  @IsString()
  responsibleCpf?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
