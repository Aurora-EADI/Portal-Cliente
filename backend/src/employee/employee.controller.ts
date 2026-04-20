import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Logger,
} from "@nestjs/common";
import { EmployeesService } from "./employee.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("employees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEmployeeDto) {
    this.logger.log(`Criando funcionário: ${JSON.stringify(dto)}`);
    return this.employeesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    this.logger.log("Listando todos os funcionários");
    return this.employeesService.findAll();
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(`Buscando funcionário com ID: ${id}`);
    return this.employeesService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    this.logger.log(
      `Atualizando funcionário ${id} com dados: ${JSON.stringify(dto)}`,
    );
    return this.employeesService.update(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(`Removendo funcionário com ID: ${id}`);
    return this.employeesService.remove(id);
  }
}
