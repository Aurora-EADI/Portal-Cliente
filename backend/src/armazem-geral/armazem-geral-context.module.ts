import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ArmazemGeralContextService } from "./armazem-geral-context.service";
import { ArmazemGeralAuditService } from "./armazem-geral-audit.service";

@Module({
  imports: [PrismaModule],
  providers: [ArmazemGeralContextService, ArmazemGeralAuditService],
  exports: [ArmazemGeralContextService, ArmazemGeralAuditService],
})
export class ArmazemGeralContextModule {}
