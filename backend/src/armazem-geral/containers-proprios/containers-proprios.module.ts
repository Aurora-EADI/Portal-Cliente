import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { ContainersPropriosController } from "./containers-proprios.controller";
import { ContainersPropriosService } from "./containers-proprios.service";


@Module({
  imports: [PrismaModule, ArmazemGeralContextModule],
  controllers: [ContainersPropriosController],
  providers: [ContainersPropriosService],
})
export class ArmazemGeralContainersPropriosModule {}
