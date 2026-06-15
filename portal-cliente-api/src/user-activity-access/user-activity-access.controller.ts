import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { UserActivityAccessService } from './user-activity-access.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('user-activity-access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserActivityAccessController {
  constructor(private service: UserActivityAccessService) {}

  // GET /stats/activities — deve vir ANTES de /:userId para não conflitar
  @Get('stats/activities')
  @Roles(UserRole.ADMIN)
  getStats(@Query('moduleId') moduleId?: string) {
    return this.service.getActivityUsageStats(moduleId ? Number(moduleId) : undefined);
  }

  // GET /:userId/:moduleId/activities
  @Get(':userId/:moduleId/activities')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  getActivities(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) { return this.service.getActivitiesAccess(userId, moduleId); }

  // PUT /:userId/module/:moduleId/activity/:activityId
  @Put(':userId/module/:moduleId/activity/:activityId')
  @Roles(UserRole.ADMIN)
  toggleActivity(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body('isEnabled') isEnabled: boolean,
  ) { return this.service.toggleActivity(userId, moduleId, activityId, isEnabled); }

  // POST /:userId/module/:moduleId/bulk
  @Post(':userId/module/:moduleId/bulk')
  @Roles(UserRole.ADMIN)
  configureBulk(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body('activities') updates: { activityId: number; isEnabled: boolean }[],
  ) { return this.service.configureBulkActivities(userId, moduleId, updates); }

  // DELETE /:userId/:moduleId/activity/:activityId/exception
  @Delete(':userId/:moduleId/activity/:activityId/exception')
  @Roles(UserRole.ADMIN)
  removeException(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) { return this.service.removeActivityException(userId, moduleId, activityId); }

  // DELETE /:userId/:moduleId/reset
  @Delete(':userId/:moduleId/reset')
  @Roles(UserRole.ADMIN)
  resetActivities(
    @Param('userId') userId: string,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) { return this.service.resetModuleActivities(userId, moduleId); }
}
