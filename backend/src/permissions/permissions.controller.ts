import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { PermissionsService } from "./permissions.service";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";

@Controller("permissions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * GET /permissions
   * Lista todas as permissÃµes tÃ©cnicas
   * Query params:
   *  - category: filtrar por categoria (opcional)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query("category") category?: string) {
    return this.permissionsService.findAll(category);
  }

  /**
   * GET /permissions/categories
   * Lista todas as categorias Ãºnicas
   */
  @Get("categories")
  @Roles(UserRole.ADMIN)
  async getCategories() {
    return this.permissionsService.getCategories();
  }

  /**
   * GET /permissions/orphaned
   * Lista permissÃµes nÃ£o vinculadas a atividades
   */
  @Get("orphaned")
  @Roles(UserRole.ADMIN)
  async findOrphaned() {
    return this.permissionsService.findOrphaned();
  }

  /**
   * GET /permissions/:id
   * Busca uma permissÃ£o especÃ­fica
   */
  @Get(":id")
  @Roles(UserRole.ADMIN)
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  /**
   * POST /permissions
   * Cria uma nova permissÃ£o tÃ©cnica
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  /**
   * PATCH /permissions/:id
   * Atualiza uma permissÃ£o existente
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  /**
   * DELETE /permissions/:id
   * Remove uma permissÃ£o
   * SÃ³ permite se nÃ£o houver atividades vinculadas
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }
}

