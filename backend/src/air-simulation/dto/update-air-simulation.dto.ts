import { PartialType } from "@nestjs/mapped-types";
import { CreateAirSimulationDto } from "./create-air-simulation.dto";
import { IsEnum, IsOptional } from "class-validator";
import { SimulationStatus } from "@prisma/client";

export class UpdateAirSimulationDto extends PartialType(
  CreateAirSimulationDto,
) {
  @IsOptional()
  @IsEnum(SimulationStatus)
  status?: SimulationStatus;
}

