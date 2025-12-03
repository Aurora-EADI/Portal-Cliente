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
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UserModuleAccessService } from './user-module-access.service';
import { ToggleModuleDto } from './dto/toggle-module.dto';
import { BulkAssignModulesDto } from './dto/bulk-assign-modules.dto';

@Controller('user-module-access')
@UseGuards(JwtAuthGuard)
export class UserModuleAccessController {
  constructor(
    private readonly userModuleAccessService: UserModuleAccessService,
  ) {}

  /**
   * GET /user-module-access/:userId
   * Lista todos os módulos com status de acesso do usuário
   * DIFERENTE de GET /users/:id/modules (que só lista os que têm acesso)
   */
  @Get(':userId')
  @Roles(UserRole.ADMIN)
  async getUserModulesWithAccessStatus(@Param('userId') userId: string) {
    return this.userModuleAccessService.getUserModulesWithAccessStatus(userId);
  }

  /**
   * GET /user-module-access/stats/modules
   * Estatísticas de uso dos módulos
   */
  @Get('stats/modules')
  @Roles(UserRole.ADMIN)
  async getModuleUsageStats() {
    return this.userModuleAccessService.getModuleUsageStats();
  }

  /**
   * PUT /user-module-access/:userId/toggle/:moduleId
   * Ativa/Desativa um módulo para o usuário
   */
  @Put(':userId/toggle/:moduleId')
  @Roles(UserRole.ADMIN)
  async toggleModule(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
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
   * Atribui múltiplos módulos de uma vez
   */
  @Post(':userId/bulk')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async assignMultipleModules(
    @Param('userId') userId: string,
    @Body() bulkDto: BulkAssignModulesDto,
  ) {
    return this.userModuleAccessService.assignMultipleModules(userId, bulkDto);
  }

  /**
   * POST /user-module-access/sync/:moduleId
   * Sincroniza atividades obrigatórias
   */
  @Post('sync/:moduleId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async syncMandatoryActivities(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.userModuleAccessService.syncMandatoryActivities(moduleId);
  }

  /**
   * DELETE /user-module-access/:userId/remove/:moduleId
   * Remove completamente o acesso a um módulo
   */
  @Delete(':userId/remove/:moduleId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async removeModuleAccess(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    return this.userModuleAccessService.removeModuleAccess(userId, moduleId);
  }
}