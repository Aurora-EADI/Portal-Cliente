import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateModuleDto, UpdateModuleDto, AddSharedItemDto, UpdateSharedItemDto } from './dto/module.dto';

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
  create(@Body() dto: CreateModuleDto) { return this.modulesService.create(dto); }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModuleDto) { return this.modulesService.update(id, dto); }

  @Post(':id/shared-items')
  @Roles(UserRole.ADMIN)
  addSharedItem(@Param('id', ParseIntPipe) id: number, @Body() dto: AddSharedItemDto) { return this.modulesService.addSharedItem(id, dto); }

  @Patch('shared-items/:itemId')
  @Roles(UserRole.ADMIN)
  updateSharedItem(@Param('itemId', ParseIntPipe) itemId: number, @Body() dto: UpdateSharedItemDto) { return this.modulesService.updateSharedItem(itemId, dto); }

  @Delete('shared-items/:itemId')
  @Roles(UserRole.ADMIN)
  deleteSharedItem(@Param('itemId', ParseIntPipe) itemId: number) { return this.modulesService.deleteSharedItem(itemId); }
}
