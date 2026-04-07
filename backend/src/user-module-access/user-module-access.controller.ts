import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { UserModuleAccessService } from "./user-module-access.service";
import { ToggleModuleDto } from "./dto/toggle-module.dto";
import { BulkAssignModulesDto } from "./dto/bulk-assign-modules.dto";

@Controller("user-module-access")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserModuleAccessController {
  constructor(
    private readonly userModuleAccessService: UserModuleAccessService,
  ) {}

  /**
   * GET /user-module-access/:userId
   * Lista todos os mÃ³dulos com status de acesso do usuÃ¡rio
   * DIFERENTE de GET /users/:id/modules (que sÃ³ lista os que tÃªm acesso)
   */
  @Get(":userId")
  async getUserModulesWithAccessStatus(@Param("userId") userId: string) {
    return this.userModuleAccessService.getUserModulesWithAccessStatus(userId);
  }

  /**
   * GET /user-module-access/stats/modules
   * EstatÃ­sticas de uso dos mÃ³dulos
   */
  @Get("stats/modules")
  @Roles(UserRole.ADMIN)
  async getModuleUsageStats() {
    return this.userModuleAccessService.getModuleUsageStats();
  }

  /**
   * PUT /user-module-access/:userId/toggle/:moduleId
   * Ativa/Desativa um mÃ³dulo para o usuÃ¡rio
   */
  @Put(":userId/toggle/:moduleId")
  @Roles(UserRole.ADMIN)
  async toggleModule(
    @Param("userId") userId: string,
    @Param("moduleId", ParseIntPipe) moduleId: number,
    @Body() toggleDto: ToggleModuleDto,
  ) {
    return this.userModuleAccessService.toggleModule(
      userId,
      moduleId,
      toggleDto,
    );
  }

  /**
   * POST /user-module-access/:userId/bulk
   * Atribui mÃºltiplos mÃ³dulos de uma vez
   */
  @Post(":userId/bulk")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async assignMultipleModules(
    @Param("userId") userId: string,
    @Body() bulkDto: BulkAssignModulesDto,
  ) {
    return this.userModuleAccessService.assignMultipleModules(userId, bulkDto);
  }

  /**
   * POST /user-module-access/sync/:moduleId
   * Sincroniza atividades obrigatÃ³rias
   */
  @Post("sync/:moduleId")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async syncMandatoryActivities(
    @Param("moduleId", ParseIntPipe) moduleId: number,
  ) {
    return this.userModuleAccessService.syncMandatoryActivities(moduleId);
  }

  /**
   * DELETE /user-module-access/:userId/remove/:moduleId
   * Remove completamente o acesso a um mÃ³dulo
   */
  @Delete(":userId/remove/:moduleId")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async removeModuleAccess(
    @Param("userId") userId: string,
    @Param("moduleId", ParseIntPipe) moduleId: number,
  ) {
    return this.userModuleAccessService.removeModuleAccess(userId, moduleId);
  }
}

