// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

    // Rotas CRUD básicas
    
  // router.get('/users', UsersController.index);
  // router.post('/users', UsersController.store);
  // router.get('/users/:id', UsersController.show);
  // router.patch('/users/:id', UsersController.update);
  // router.delete('/users/:id', UsersController.destroy);
  
  // Rotas de relacionamentos (módulos, atividades, permissões)
  // router.get('/users/:id/modules', UsersController.getUserModules);
  // router.get('/users/:id/activities', UsersController.getUserActivities);
  // router.get('/users/:id/permissions', UsersController.getUserPermissions);

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get(':id/modules')
  getUserModules(@Param('id') id: string) {
    return this.usersService.getUserModules(id);
  }

  @Get(':id/activities')
  getUserActivities(@Param('id') id: string) {
    return this.usersService.getUserActivities(id);
  }

  @Get(':id/permissions')
  getUserPermissions(@Param('id') id: string) {
    return this.usersService.getUserPermissions(id);
  }
}