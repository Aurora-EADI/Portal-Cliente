import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RequirementRulesService } from "./requirement-rules.service";
import { RequirementRulesController } from "./requirement-rules.controller";

@Module({
  imports: [PrismaModule],
  providers: [RequirementRulesService],
  controllers: [RequirementRulesController],
  exports: [RequirementRulesService],
})
export class RequirementRulesModule {}
