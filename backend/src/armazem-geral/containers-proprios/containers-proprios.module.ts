import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { ContainersPropriosController } from "./containers-proprios.controller";
import { ContainersPropriosService } from "./containers-proprios.service";
import { ContainersAgSuppliersModule } from "./suppliers/suppliers.module";
import { ContainersAgSuppliersService } from "./suppliers/suppliers.service";

@Module({
  imports: [PrismaModule, ArmazemGeralContextModule, ContainersAgSuppliersModule],
  controllers: [ContainersPropriosController],
  providers: [ContainersPropriosService, ContainersAgSuppliersService],
})
export class ArmazemGeralContainersPropriosModule {}
