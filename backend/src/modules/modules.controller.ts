import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ModulesService } from "./modules.service";
import { CreateModuleDto } from "./dto/create-module.dto";
import { UpdateModuleDto } from "./dto/update-module.dto";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client-postgres";
import {
  AVAILABLE_MODULE_ROUTES,
  AVAILABLE_SUB_ROUTES,
} from "./available-routes";

@Controller("modules")
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get("available-routes")
  async getAvailableRoutes() {
    return {
      moduleRoutes: AVAILABLE_MODULE_ROUTES,
      subRoutes: AVAILABLE_SUB_ROUTES,
    };
  }

  @Get()
  async findAll() {
    return this.modulesService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.modulesService.findOne(Number(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  async update(
    @Param("id") id: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    return this.modulesService.update(Number(id), updateModuleDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    await this.modulesService.remove(id);
  }
}
