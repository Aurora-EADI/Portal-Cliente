import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
} from "class-validator";
import { ServiceCalculationType, ServiceModal } from "@prisma/client";

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

  @IsEnum(ServiceModal)
  @IsNotEmpty()
  modal: ServiceModal;

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

  @IsOptional()
  @IsBoolean()
  hasLcl?: boolean;
}
