import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { ConferentesService } from "./conferentes.service";
import { CreateConferenteDto } from "./dto/create-conferente.dto";
import { UpdateConferenteDto } from "./dto/update-conferente.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Conferentes (Armazém Geral)")
@Controller("armazem-geral/conferentes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConferentesController {
  constructor(private readonly conferentesService: ConferentesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Cadastrar novo conferente" })
  @ApiResponse({
    status: 201,
    description: "Conferente cadastrado com sucesso.",
  })
  create(@Body() createConferenteDto: CreateConferenteDto) {
    return this.conferentesService.create(createConferenteDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Listar todos os conferentes do armazém logado" })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.conferentesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Obter detalhes de um conferente" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.conferentesService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Atualizar dados de um conferente" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateConferenteDto: UpdateConferenteDto,
  ) {
    return this.conferentesService.update(id, updateConferenteDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remover um conferente" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.conferentesService.remove(id);
  }
}
