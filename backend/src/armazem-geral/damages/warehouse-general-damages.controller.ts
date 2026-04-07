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
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateDamageDto } from "./dto/create-damage.dto";
import { ResolveDamageDto } from "./dto/resolve-damage.dto";
import { WarehouseGeneralDamagesService } from "./warehouse-general-damages.service";

@Controller("armazem-geral/damages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseGeneralDamagesController {
  constructor(private readonly service: WarehouseGeneralDamagesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateDamageDto,
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
    @Query("severity") severity?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      severity,
    });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id/resolve")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ResolveDamageDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.resolve(id, dto, req.user.id);
  }
}
