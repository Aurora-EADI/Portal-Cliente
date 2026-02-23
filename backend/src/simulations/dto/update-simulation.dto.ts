import { PartialType } from "@nestjs/mapped-types";
import { CreateSimulationDto } from "./create-simulation.dto";
import { IsEnum, IsOptional } from "class-validator";
import { SimulationStatus } from "@prisma/client";

export class UpdateSimulationDto extends PartialType(CreateSimulationDto) {
  @IsOptional()
  @IsEnum(SimulationStatus)
  status?: SimulationStatus;
}

