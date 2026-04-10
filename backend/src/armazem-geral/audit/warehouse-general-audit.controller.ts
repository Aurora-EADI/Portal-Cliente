import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { WarehouseGeneralAuditQueryDto } from "./warehouse-general-audit.query.dto";
import { WarehouseGeneralAuditQueryService } from "./warehouse-general-audit.query.service";

@Controller("armazem-geral/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseGeneralAuditController {
  constructor(private readonly service: WarehouseGeneralAuditQueryService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(@Query() query: WarehouseGeneralAuditQueryDto) {
    return this.service.findAll(query);
  }
}
