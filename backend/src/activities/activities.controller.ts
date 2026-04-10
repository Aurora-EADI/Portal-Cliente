import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { ActivitiesService } from "./activities.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";
import { UpdateActivityPermissionsDto } from "./dto/update-activity-permissions.dto";

@Controller("activities")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * GET /activities
   * Lista todas as atividades
   * Query params:
   *  - moduleId: filtrar por módulo (opcional)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query("moduleId", new ParseIntPipe({ optional: true })) moduleId?: number,
  ) {
    return this.activitiesService.findAll(moduleId);
  }

  /**
   * GET /activities/without-permissions
   * Lista atividades sem permissões vinculadas
   */
  @Get("without-permissions")
  @Roles(UserRole.ADMIN)
  async findWithoutPermissions() {
    return this.activitiesService.findWithoutPermissions();
  }

  /**
   * GET /activities/by-category/:category
   * Lista atividades por categoria de permissão
   */
  @Get("by-category/:category")
  @Roles(UserRole.ADMIN)
  async findByPermissionCategory(@Param("category") category: string) {
    return this.activitiesService.findByPermissionCategory(category);
  }

  /**
   * GET /activities/:id
   * Busca uma atividade específica
   */
  @Get(":id")
  @Roles(UserRole.ADMIN)
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.activitiesService.findOne(id);
  }

  /**
   * POST /activities
   * Cria uma nova atividade e vincula permissões
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  /**
   * PATCH /activities/:id
   * Atualiza uma atividade (nome, módulo, isMandatory)
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  /**
   * PUT /activities/:id/permissions
   * Atualiza as permissões vinculadas (substitui todas)
   */
  @Put(":id/permissions")
  @Roles(UserRole.ADMIN)
  async updatePermissions(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePermissionsDto: UpdateActivityPermissionsDto,
  ) {
    return this.activitiesService.updatePermissions(id, updatePermissionsDto);
  }

  /**
   * DELETE /activities/:id
   * Remove uma atividade
   * Só permite se não houver usuários com acesso
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.activitiesService.remove(id);
  }
}
