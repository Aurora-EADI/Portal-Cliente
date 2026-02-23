import { IsString, IsOptional, IsBoolean, IsEnum, IsNotEmpty } from "class-validator";
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
  category?: string; // Ex: "Operacional", "LogÃ­stica"
  
  @IsEnum(ServiceModal)
  @IsNotEmpty()
  modal: ServiceModal;

  @IsOptional()
  @IsEnum(ServiceCalculationType)
  calculationType?: ServiceCalculationType; // Tipo de cÃ¡lculo do serviÃ§o

  @IsOptional()
  @IsString()
  formulaExpression?: string; // FÃ³rmula para exibiÃ§Ã£o (ex: "0.35% do CIF")

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  hasStripping?: boolean;
}

