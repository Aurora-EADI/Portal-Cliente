import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CcteService } from "./ccte.service";
import { CreateFlightDto } from "./dto/create-flight.dto";
import { UpdateFlightDto } from "./dto/update-flight.dto";
import { CreateCargoItemsDto } from "./dto/create-cargo-items.dto";
import { UpdateCargoItemDto } from "./dto/update-cargo-item.dto";
import { RevertFlightDto } from "./dto/revert-flight.dto";

@ApiTags("CCTE - Controle Aereo")
@ApiBearerAuth()
@Controller("ccte")
@UseGuards(JwtAuthGuard)
export class CcteController {
  constructor(private readonly ccteService: CcteService) {}

  // ========== FLIGHTS ==========

  @Get("flights")
  @ApiOperation({ summary: "Listar todos os voos com busca opcional" })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Busca por codigo do voo, aeronave, house, importador ou DTA",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["PENDING", "SENT"],
  })
  findAllFlights(
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    return this.ccteService.findAllFlights(search, status);
  }

  @Get("flights/:id")
  @ApiOperation({ summary: "Obter detalhe do voo com cargas e historico" })
  @ApiResponse({ status: 200, description: "Voo encontrado" })
  @ApiResponse({ status: 404, description: "Voo nao encontrado" })
  findOneFlight(@Param("id") id: string) {
    return this.ccteService.findOneFlight(id);
  }

  @Post("flights")
  @ApiOperation({ summary: "Criar novo voo" })
  @ApiResponse({ status: 201, description: "Voo criado com sucesso" })
  createFlight(@Body() createFlightDto: CreateFlightDto) {
    return this.ccteService.createFlight(createFlightDto);
  }

  @Patch("flights/:id")
  @ApiOperation({
    summary: "Editar dados do voo (requer justificativa)",
  })
  @ApiResponse({ status: 200, description: "Voo atualizado com sucesso" })
  updateFlight(
    @Param("id") id: string,
    @Body() updateFlightDto: UpdateFlightDto,
  ) {
    return this.ccteService.updateFlight(id, updateFlightDto);
  }

  @Delete("flights/:id")
  @ApiOperation({ summary: "Excluir voo e todas as cargas vinculadas" })
  @ApiResponse({ status: 200, description: "Voo excluido com sucesso" })
  deleteFlight(@Param("id") id: string) {
    return this.ccteService.deleteFlight(id);
  }

  @Patch("flights/:id/send")
  @ApiOperation({ summary: "Marcar voo como ENVIADO" })
  @ApiResponse({ status: 200, description: "Voo marcado como enviado" })
  markFlightSent(@Param("id") id: string) {
    return this.ccteService.markFlightSent(id);
  }

  @Patch("flights/:id/revert")
  @ApiOperation({
    summary: "Reverter voo ENVIADO para PENDENTE (requer justificativa)",
  })
  @ApiResponse({ status: 200, description: "Voo revertido com sucesso" })
  revertFlight(
    @Param("id") id: string,
    @Body() revertFlightDto: RevertFlightDto,
  ) {
    return this.ccteService.revertFlight(id, revertFlightDto);
  }

  @Get("flights/:id/history")
  @ApiOperation({ summary: "Obter historico de alteracoes do voo" })
  getFlightHistory(@Param("id") id: string) {
    return this.ccteService.getFlightHistory(id);
  }

  // ========== CARGO ITEMS ==========

  @Post("flights/:flightId/items")
  @ApiOperation({ summary: "Criar cargas em massa (importacao Excel)" })
  @ApiResponse({ status: 201, description: "Cargas criadas com sucesso" })
  createCargoItems(
    @Param("flightId") flightId: string,
    @Body() createCargoItemsDto: CreateCargoItemsDto,
  ) {
    return this.ccteService.createCargoItems(flightId, createCargoItemsDto);
  }

  @Patch("items/:id")
  @ApiOperation({ summary: "Editar uma carga" })
  @ApiResponse({ status: 200, description: "Carga atualizada com sucesso" })
  updateCargoItem(
    @Param("id") id: string,
    @Body() updateCargoItemDto: UpdateCargoItemDto,
  ) {
    return this.ccteService.updateCargoItem(id, updateCargoItemDto);
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "Excluir uma carga" })
  @ApiResponse({ status: 200, description: "Carga excluida com sucesso" })
  deleteCargoItem(@Param("id") id: string) {
    return this.ccteService.deleteCargoItem(id);
  }

  @Patch("items/:id/send")
  @ApiOperation({ summary: "Enviar carga individual (Quick Send)" })
  @ApiResponse({ status: 200, description: "Carga enviada com sucesso" })
  sendCargoItem(@Param("id") id: string) {
    return this.ccteService.sendCargoItem(id);
  }
}
