import { IsString, IsOptional } from "class-validator";
import { CreateAirSimulationDto } from "./create-air-simulation.dto";

export class CreateAirNewVersionDto extends CreateAirSimulationDto {
  @IsString()
  baseSimulationId: string; // ID da simulação aérea que está sendo versionada

  @IsOptional()
  @IsString()
  versionReason?: string; // Motivo da criação da nova versão
}
