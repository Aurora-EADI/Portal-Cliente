import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  code: string; // Ex: "SRV-001"

  @IsString()
  name: string; // Ex: "Armazenagem"

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string; // Ex: "Operacional", "Logística"

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
