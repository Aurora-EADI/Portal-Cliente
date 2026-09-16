import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(@Query('moduleId') moduleId?: string) {
    return this.activitiesService.findAll(moduleId ? Number(moduleId) : undefined);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() body: any) { return this.activitiesService.create(body); }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.activitiesService.update(id, body); }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) { return this.activitiesService.remove(id); }

  @Post(':id/permissions')
  @Roles(UserRole.ADMIN)
  updatePermissions(@Param('id', ParseIntPipe) id: number, @Body('permissionIds') ids: number[]) {
    return this.activitiesService.updatePermissions(id, ids);
  }
}
