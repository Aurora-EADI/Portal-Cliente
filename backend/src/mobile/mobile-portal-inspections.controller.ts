import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { MobileInspectionsService } from "./mobile-inspections.service";

@ApiTags("portal-inspections")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("portal/inspections")
export class MobilePortalInspectionsController {
  constructor(private inspectionsService: MobileInspectionsService) {}

  @Get()
  listAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("userId") userId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.inspectionsService.listAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      userId,
      startDate,
      endDate,
    });
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.inspectionsService.getOneForPortal(id);
  }
}
