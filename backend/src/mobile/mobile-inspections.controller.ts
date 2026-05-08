import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { MobileJwtGuard } from "./guards/mobile-jwt.guard";
import { MobileInspectionsService } from "./mobile-inspections.service";
import { CreateInspectionDto } from "./dto/create-inspection.dto";
import { CompleteInspectionDto } from "./dto/complete-inspection.dto";

@ApiTags("mobile-inspections")
@ApiBearerAuth()
@UseGuards(MobileJwtGuard)
@Controller("mobile/inspections")
export class MobileInspectionsController {
  constructor(private inspectionsService: MobileInspectionsService) {}

  @Get()
  list(@Req() req: any) {
    return this.inspectionsService.listInspections(req.user.id);
  }

  @Get("pending-containers")
  getPendingContainers(
    @Query("dtInicio") dtInicio?: string,
    @Query("dtFinal") dtFinal?: string,
  ) {
    return this.inspectionsService.getPendingContainersFromCache({ dtInicio, dtFinal });
  }

  @Get("container-entries")
  listContainerEntries(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("containerStatus") containerStatus?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.inspectionsService.listContainerEntries({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      containerStatus,
      startDate,
      endDate,
    });
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateInspectionDto) {
    return this.inspectionsService.createInspection(req.user.id, dto);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.inspectionsService.getInspection(id, req.user.id);
  }

  @Patch(":id")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: CompleteInspectionDto,
  ) {
    return this.inspectionsService.updateInspection(id, req.user.id, dto);
  }
}
