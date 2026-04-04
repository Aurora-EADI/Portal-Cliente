import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
