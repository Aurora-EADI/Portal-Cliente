import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { ContainersController } from "./containers.controller";
import { ContainersService } from "./containers.service";

@Module({
  imports: [PrismaModule, ArmazemGeralContextModule],
  controllers: [ContainersController],
  providers: [ContainersService],
  exports: [ContainersService],
})
export class ArmazemGeralContainersModule {}
