import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { WarehouseGeneralDashboardService } from "./warehouse-general-dashboard.service";

@Controller("armazem-geral/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseGeneralDashboardController {
  constructor(private readonly service: WarehouseGeneralDashboardService) {}

  @Get("overview")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  overview() {
    return this.service.overview();
  }

  @Get("kpis")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  kpis(@Query("year") year?: string, @Query("month") month?: string) {
    return this.service.kpis({
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    });
  }

  @Get("top-customers")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  topCustomers(@Query("limit") limit?: string) {
    return this.service.topCustomers({
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("patio-distribution")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  patioDistribution() {
    return this.service.patioDistribution();
  }

  @Get("transshipments-monthly")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  transshipmentsMonthly(@Query("months") months?: string) {
    return this.service.transshipmentsMonthly({
      months: months ? parseInt(months, 10) : undefined,
    });
  }

  @Get("demurrage")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  demurrage(@Query("days") days?: string, @Query("limit") limit?: string) {
    return this.service.demurrage({
      days: days ? parseInt(days, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
