import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { WarehouseGeneralReportsService } from "./warehouse-general-reports.service";

@Controller("armazem-geral/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseGeneralReportsController {
  constructor(private readonly service: WarehouseGeneralReportsService) {}

  @Get("containers")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  containers(
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.containers({ status, from, to });
  }
}
