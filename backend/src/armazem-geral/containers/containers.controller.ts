import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { ContainersService } from "./containers.service";
import { ContainerQueryDto } from "./dto/container-query.dto";
import { EntryContainerDto } from "./dto/entry-container.dto";
import { ExitContainerDto } from "./dto/exit-container.dto";
import { UpdateContainerLocationDto } from "./dto/update-container-location.dto";
import { UpdateOperationalContainerDto } from "./dto/update-operational-container.dto";

@Controller("armazem-geral/containers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOperationalContainerDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.containersService.update(id, dto, req.user.id);
  }

  @Post("entry")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  entry(
    @Body() dto: EntryContainerDto,
    @Request() req: { user: { id: string } },
  ) {
    console.log("[DEBUG] EntryContainerDto received:", dto);
    return this.containersService.entry(dto, req.user.id);
  }

  @Post(":id/exit")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  exit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ExitContainerDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.containersService.exit(id, dto, req.user.id);
  }

  @Patch(":id/location")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  updateLocation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateContainerLocationDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.containersService.updateLocation(id, dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(@Query() query: ContainerQueryDto) {
    return this.containersService.findAll(query);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.containersService.findOne(id);
  }

  @Get(":id/movements")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  movements(@Param("id", ParseUUIDPipe) id: string) {
    return this.containersService.getMovements(id);
  }
}
