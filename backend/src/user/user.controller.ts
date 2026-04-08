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
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserQueryDto } from "./dto/user-query.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }

  @Get(":id/modules")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  getUserModules(@Param("id") id: string) {
    return this.usersService.getUserModules(id);
  }

  @Get(":id/activities")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  getUserActivities(@Param("id") id: string) {
    return this.usersService.getUserActivities(id);
  }

  @Get(":id/permissions")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  getUserPermissions(@Param("id") id: string) {
    return this.usersService.getUserPermissions(id);
  }
}
