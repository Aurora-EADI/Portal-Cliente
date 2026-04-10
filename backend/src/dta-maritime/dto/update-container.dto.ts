import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateContainerDto {
  @ApiPropertyOptional({ example: "MSCU1234567" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  number?: string;

  @ApiPropertyOptional({ example: "40HC" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tipo?: string;
}
