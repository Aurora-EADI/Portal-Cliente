import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UserModuleAccessService } from './user-module-access.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('user-module-access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserModuleAccessController {
  constructor(private service: UserModuleAccessService) {}

  @Get('stats/modules')
  @Roles(UserRole.ADMIN)
  getStats() { return this.service.getModuleUsageStats(); }

  @Get(':userId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  getUserModules(@Param('userId') userId: string) {
    return this.service.getUserModulesWithAccessStatus(userId);
  }

  @Put(':userId/toggle/:moduleId')
  @Roles(UserRole.ADMIN)
  toggleModule(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body('isEnabled') isEnabled: boolean,
  ) { return this.service.toggleModule(userId, moduleId, isEnabled); }

  @Post(':userId/bulk')
  @Roles(UserRole.ADMIN)
  assignMultiple(
    @Param('userId') userId: string,
    @Body('modules') updates: { moduleId: number; isEnabled: boolean }[],
  ) { return this.service.assignMultipleModules(userId, updates); }

  @Delete(':userId/remove/:moduleId')
  @Roles(UserRole.ADMIN)
  removeAccess(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) { return this.service.removeModuleAccess(userId, moduleId); }
}
