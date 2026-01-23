import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ServiceCalculationType } from '@prisma/client-postgres';

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
  @IsEnum(ServiceCalculationType)
  calculationType?: ServiceCalculationType; // Tipo de cálculo do serviço

  @IsOptional()
  @IsString()
  formulaExpression?: string; // Fórmula para exibição (ex: "0.35% do CIF")

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  hasStripping?: boolean;
}
