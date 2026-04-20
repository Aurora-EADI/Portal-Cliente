import { Module } from "@nestjs/common";
import { SupplierController } from "./supplier.controller";
import { SupplierService } from "./supplier.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RequirementRulesModule } from "../requirement-rules/requirement-rules.module";

@Module({
  imports: [PrismaModule, RequirementRulesModule],
  controllers: [SupplierController],
  providers: [SupplierService],
})
export class SupplierModule {}
