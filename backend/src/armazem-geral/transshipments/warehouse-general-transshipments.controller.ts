import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateTransshipmentDto } from "./dto/create-transshipment.dto";
import { CompleteTransshipmentDto } from "./dto/complete-transshipment.dto";
import { UpdateTransshipmentDto } from "./dto/update-transshipment.dto";
import { WarehouseGeneralTransshipmentsService } from "./warehouse-general-transshipments.service";

@Controller("armazem-geral/transshipments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseGeneralTransshipmentsController {
  constructor(
    private readonly service: WarehouseGeneralTransshipmentsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateTransshipmentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Patch(":id/complete")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  complete(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CompleteTransshipmentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.complete(id, dto, req.user.id);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransshipmentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
