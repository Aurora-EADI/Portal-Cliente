import { Module } from "@nestjs/common";
import { ProtheusSupplierController } from "./protheus-supplier.controller";
import { ProtheusSupplierService } from "./protheus-supplier.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ProtheusSupplierController],
  providers: [ProtheusSupplierService],
})
export class ProtheusIntegrationModule {}
