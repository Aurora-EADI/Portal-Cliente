import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll() { return this.modulesService.findAll(); }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param('id', ParseIntPipe) id: number) { return this.modulesService.findOne(id); }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() body: any) { return this.modulesService.create(body); }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.modulesService.update(id, body); }

  @Post(':id/shared-items')
  @Roles(UserRole.ADMIN)
  addSharedItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.modulesService.addSharedItem(id, body); }

  @Patch('shared-items/:itemId')
  @Roles(UserRole.ADMIN)
  updateSharedItem(@Param('itemId', ParseIntPipe) itemId: number, @Body() body: any) { return this.modulesService.updateSharedItem(itemId, body); }

  @Delete('shared-items/:itemId')
  @Roles(UserRole.ADMIN)
  deleteSharedItem(@Param('itemId', ParseIntPipe) itemId: number) { return this.modulesService.deleteSharedItem(itemId); }
}
