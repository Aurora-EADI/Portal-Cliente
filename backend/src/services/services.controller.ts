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

@ApiTags("Serviços")
@ApiBearerAuth()
@Controller("services")
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: "Criar novo serviço" })
  @ApiResponse({ status: 201, description: "Serviço criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  create(@Body() createServiceDto: CreateServiceDto, @Request() req) {
    return this.servicesService.create(createServiceDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos os serviços" })
  @ApiQuery({
    name: "includeInactive",
    required: false,
    description: "Incluir serviços inativos",
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: "Lista de serviços retornada com sucesso",
  })
  findAll(@Query("includeInactive") includeInactive?: string) {
    const include = includeInactive === "true";
    return this.servicesService.findAll(include);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obter detalhes de um serviço específico" })
  @ApiResponse({ status: 200, description: "Serviço encontrado" })
  @ApiResponse({ status: 404, description: "Serviço não encontrado" })
  findOne(@Param("id") id: string) {
    return this.servicesService.findOne(id);
  }

  @Get(":id/current-cost")
  @ApiOperation({ summary: "Obter custo atual de um serviço" })
  @ApiResponse({
    status: 200,
    description: "Custo atual retornado com sucesso",
  })
  @ApiResponse({ status: 404, description: "Serviço não encontrado" })
  getCurrentCost(@Param("id") id: string) {
    return this.servicesService.getCurrentCost(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar dados de um serviço" })
  @ApiResponse({ status: 200, description: "Serviço atualizado com sucesso" })
  @ApiResponse({ status: 404, description: "Serviço não encontrado" })
  update(@Param("id") id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Desativar serviço (soft delete)" })
  @ApiResponse({ status: 200, description: "Serviço desativado com sucesso" })
  @ApiResponse({ status: 404, description: "Serviço não encontrado" })
  remove(@Param("id") id: string) {
    return this.servicesService.remove(id);
  }

  @Delete(":id/hard")
  @ApiOperation({ summary: "Deletar serviço permanentemente (hard delete)" })
  @ApiResponse({ status: 200, description: "Serviço deletado permanentemente" })
  @ApiResponse({ status: 404, description: "Serviço não encontrado" })
  hardDelete(@Param("id") id: string) {
    return this.servicesService.hardDelete(id);
  }
}
