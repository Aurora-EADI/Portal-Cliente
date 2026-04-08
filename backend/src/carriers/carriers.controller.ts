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
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CarriersService } from "./carriers.service";
import { CreateCarrierDto } from "./dto/create-carrier.dto";
import { UpdateCarrierDto } from "./dto/update-carrier.dto";
import { UpsertCarrierDriverDto } from "./dto/upsert-carrier-driver.dto";
import { UpsertCarrierVehicleDto } from "./dto/upsert-carrier-vehicle.dto";

@Controller("carriers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCarrierDto) {
    return this.carriersService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("active") active?: string,
  ) {
    return this.carriersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      active: active === undefined ? undefined : active === "true",
    });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.carriersService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCarrierDto) {
    return this.carriersService.update(id, dto);
  }

  @Patch(":id/drivers")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  upsertDrivers(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() drivers: UpsertCarrierDriverDto[],
  ) {
    return this.carriersService.upsertDrivers(id, drivers);
  }

  @Patch(":id/vehicles")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  upsertVehicles(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() vehicles: UpsertCarrierVehicleDto[],
  ) {
    return this.carriersService.upsertVehicles(id, vehicles);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.carriersService.remove(id);
  }
}

