import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { ArmazemGeralContextModule } from "../../armazem-geral-context.module";
import { ContainersAgSuppliersController } from "./suppliers.controller";
import { ContainersAgSuppliersService } from "./suppliers.service";

@Module({
  imports: [PrismaModule, ArmazemGeralContextModule],
  controllers: [ContainersAgSuppliersController],
  providers: [ContainersAgSuppliersService],
  exports: [ContainersAgSuppliersService],
})
export class ContainersAgSuppliersModule {}
