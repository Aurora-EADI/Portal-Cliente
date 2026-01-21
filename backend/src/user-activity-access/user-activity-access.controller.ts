import {
  Controller,
  Get,
  Put,
  Post,
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
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client-postgres";
import { UserActivityAccessService } from "./user-activity-access.service";
import { ToggleActivityDto } from "./dto/toggle-activity.dto";
import { BulkConfigureActivitiesDto } from "./dto/bulk-configure-activities.dto";

@Controller("user-activity-access")
@UseGuards(JwtAuthGuard)
export class UserActivityAccessController {
  constructor(
    private readonly userActivityAccessService: UserActivityAccessService,
  ) {}

  /**
   * GET /user-activity-access/:userId/module/:moduleId
   * Lista atividades do módulo com status de acesso
   */
  @Get(":userId/module/:moduleId")
  @Roles(UserRole.ADMIN)
  async getActivitiesAccess(
    @Param("userId") userId: string,
    @Param("moduleId", ParseIntPipe) moduleId: number,
  ) {
    return this.userActivityAccessService.getActivitiesAccess(userId, moduleId);
  }

  /**
   * GET /user-activity-access/stats
   * Estatísticas de uso de atividades
   * Query params: moduleId (opcional)
   */
  @Get("stats")
  @Roles(UserRole.ADMIN)
  async getActivityUsageStats(
    @Query("moduleId", new ParseIntPipe({ optional: true })) moduleId?: number,
  ) {
    return this.userActivityAccessService.getActivityUsageStats(moduleId);
  }

  /**
   * PUT /user-activity-access/:userId/module/:moduleId/activity/:activityId
   * Ativa/Desativa uma atividade específica
   */
  @Put(":userId/module/:moduleId/activity/:activityId")
  @Roles(UserRole.ADMIN)
  async toggleActivity(
    @Param("userId") userId: string,
    @Param("moduleId", ParseIntPipe) moduleId: number,
    @Param("activityId", ParseIntPipe) activityId: number,
    @Body() toggleDto: ToggleActivityDto,
  ) {
    return this.userActivityAccessService.toggleActivity(
      userId,
      moduleId,
      activityId,
      toggleDto,
    );
  }

  /**
   * POST /user-activity-access/:userId/module/:moduleId/bulk
   * Configura múltiplas atividades de uma vez
   */
  @Post(":userId/module/:moduleId/bulk")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async configureBulkActivities(
    @Param("userId") userId: string,
    @Param("moduleId", ParseIntPipe) moduleId: number,
    @Body() bulkDto: BulkConfigureActivitiesDto,
  ) {
    return this.userActivityAccessService.configureBulkActivities(
      userId,
      moduleId,
      bulkDto,
    );
  }

  /**
   * DELETE /user-activity-access/:userId/module/:moduleId/activity/:activityId
   * Remove exceção (volta ao padrão)
   */
  @Delete(":userId/module/:moduleId/activity/:activityId")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async removeActivityException(
    @Param("userId") userId: string,
    @Param("moduleId", ParseIntPipe) moduleId: number,
    @Param("activityId", ParseIntPipe) activityId: number,
  ) {
    return this.userActivityAccessService.removeActivityException(
      userId,
      moduleId,
      activityId,
    );
  }

  /**
   * POST /user-activity-access/:userId/module/:moduleId/reset
   * Reseta todas as exceções do módulo
   */
  @Post(":userId/module/:moduleId/reset")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async resetModuleActivities(
    @Param("userId") userId: string,
    @Param("moduleId", ParseIntPipe) moduleId: number,
  ) {
    return this.userActivityAccessService.resetModuleActivities(
      userId,
      moduleId,
    );
  }
}
