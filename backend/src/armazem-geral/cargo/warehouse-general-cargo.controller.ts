import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateWarehouseCargoDto } from "./dto/create-warehouse-cargo.dto";
import { UpdateWarehouseCargoDto } from "./dto/update-warehouse-cargo.dto";
import { WarehouseGeneralCargoService } from "./warehouse-general-cargo.service";

@Controller("armazem-geral/cargos")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseGeneralCargoController {
  constructor(private readonly service: WarehouseGeneralCargoService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateWarehouseCargoDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("containerIds") containerIds?: string,
    @Query("ownedContainerIds") ownedContainerIds?: string,
    @Query("activeOnly") activeOnly?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      containerIds,
      ownedContainerIds,
      activeOnly: activeOnly === "true" || activeOnly === "1",
    });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseCargoDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
