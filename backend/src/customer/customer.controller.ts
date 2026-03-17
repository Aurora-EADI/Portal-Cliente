import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Logger,
  Query,
} from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole, CustomerStatus } from "@prisma/client";

@Controller("customers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCustomerDto) {
    this.logger.log(`Criando cliente: ${dto.name}`);
    return this.customerService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: CustomerStatus,
  ) {
    this.logger.log("Listando todos os clientes");
    return this.customerService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
    });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(`Buscando cliente ID: ${id}`);
    return this.customerService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    this.logger.log(`Atualizando cliente ID: ${id}`);
    return this.customerService.update(id, dto);
  }

  @Patch(":id/status")
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("status") status: CustomerStatus,
  ) {
    this.logger.log(`Atualizando status do cliente ID: ${id} para ${status}`);
    return this.customerService.updateStatus(id, status);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(`Removendo cliente ID: ${id}`);
    return this.customerService.remove(id);
  }
}

