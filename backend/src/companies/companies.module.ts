import { Module } from "@nestjs/common";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RequirementRulesModule } from "../requirement-rules/requirement-rules.module";

@Module({
  imports: [PrismaModule, RequirementRulesModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
