import { IsString, IsOptional } from 'class-validator';
import { CreateSimulationDto } from './create-simulation.dto';

export class CreateNewVersionDto extends CreateSimulationDto {
  @IsString()
  baseSimulationId: string; // ID da simulação que está sendo versionada

  @IsOptional()
  @IsString()
  versionReason?: string; // Motivo da criação da nova versão
}
