import { Module } from "@nestjs/common";
import { AirSimulationsService } from "./air-simulation.service";
import { AirSimulationsController } from "./air-simulation.controller";
import { AirCalculationService } from "./air-calculation.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [AirSimulationsService, AirCalculationService],
  controllers: [AirSimulationsController],
})
export class AirSimulationModule {}
