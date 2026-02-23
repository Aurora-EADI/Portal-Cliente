import { ServiceModal } from "@prisma/client";
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ServicesService } from "./services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("ServiÃ§os")
@ApiBearerAuth()
@Controller("services")
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: "Criar novo serviÃ§o" })
  @ApiResponse({ status: 201, description: "ServiÃ§o criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados invÃ¡lidos" })
  create(@Body() createServiceDto: CreateServiceDto, @Request() req) {
    return this.servicesService.create(createServiceDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos os serviÃ§os" })
  @ApiQuery({
    name: "includeInactive",
    required: false,
    description: "Incluir serviÃ§os inativos",
    type: Boolean,
  })
  @ApiQuery({
    name: "modal",
    required: false,
    description: "Filtrar por modal (AIR, MARITIME, BOTH)",
    enum: ServiceModal,
  })
  @ApiResponse({
    status: 200,
    description: "Lista de serviÃ§os retornada com sucesso",
  })
  findAll(
    @Query("includeInactive") includeInactive?: string,
    @Query("modal") modal?: ServiceModal,
  ) {
    const include = includeInactive === "true";
    return this.servicesService.findAll(include, modal);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obter detalhes de um serviÃ§o especÃ­fico" })
  @ApiResponse({ status: 200, description: "ServiÃ§o encontrado" })
  @ApiResponse({ status: 404, description: "ServiÃ§o nÃ£o encontrado" })
  findOne(@Param("id") id: string) {
    return this.servicesService.findOne(id);
  }

  @Get(":id/current-cost")
  @ApiOperation({ summary: "Obter custo atual de um serviÃ§o" })
  @ApiResponse({
    status: 200,
    description: "Custo atual retornado com sucesso",
  })
  @ApiResponse({ status: 404, description: "ServiÃ§o nÃ£o encontrado" })
  getCurrentCost(@Param("id") id: string) {
    return this.servicesService.getCurrentCost(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar dados de um serviÃ§o" })
  @ApiResponse({ status: 200, description: "ServiÃ§o atualizado com sucesso" })
  @ApiResponse({ status: 404, description: "ServiÃ§o nÃ£o encontrado" })
  update(@Param("id") id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Desativar serviÃ§o (soft delete)" })
  @ApiResponse({ status: 200, description: "ServiÃ§o desativado com sucesso" })
  @ApiResponse({ status: 404, description: "ServiÃ§o nÃ£o encontrado" })
  remove(@Param("id") id: string) {
    return this.servicesService.remove(id);
  }

  @Delete(":id/hard")
  @ApiOperation({ summary: "Deletar serviÃ§o permanentemente (hard delete)" })
  @ApiResponse({ status: 200, description: "ServiÃ§o deletado permanentemente" })
  @ApiResponse({ status: 404, description: "ServiÃ§o nÃ£o encontrado" })
  hardDelete(@Param("id") id: string) {
    return this.servicesService.hardDelete(id);
  }
}

