import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DtaMaritimeService } from './dta-maritime.service';
import { CreateContainerDto, CreateProcessoDto } from './dto/create-processo.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { UpdateProcessoDto } from './dto/update-processo.dto';

@ApiTags('DTA Maritimo')
@ApiBearerAuth()
@Controller('dta-maritime')
@UseGuards(JwtAuthGuard)
export class DtaMaritimeController {
  constructor(private readonly dtaMaritimeService: DtaMaritimeService) {}

  // ========== PROCESSOS ==========

  @Get('processos')
  @ApiOperation({ summary: 'Listar processos de importacao' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.dtaMaritimeService.findAll(search);
  }

  @Get('processos/:id')
  @ApiOperation({ summary: 'Obter processo por ID com containers e BLs' })
  findById(@Param('id') id: string) {
    return this.dtaMaritimeService.findById(id);
  }

  @Post('processos')
  @ApiOperation({ summary: 'Criar processo de importacao com containers e BLs' })
  create(@Body() dto: CreateProcessoDto) {
    return this.dtaMaritimeService.create(dto);
  }

  @Patch('processos/:id')
  @ApiOperation({ summary: 'Atualizar processo de importacao' })
  update(@Param('id') id: string, @Body() dto: UpdateProcessoDto) {
    return this.dtaMaritimeService.update(id, dto);
  }

  @Delete('processos/:id')
  @ApiOperation({ summary: 'Excluir processo de importacao' })
  delete(@Param('id') id: string) {
    return this.dtaMaritimeService.delete(id);
  }

  // ========== CONTAINERS ==========

  @Post('processos/:id/containers')
  @ApiOperation({ summary: 'Adicionar container ao processo com BLs' })
  addContainer(@Param('id') processoId: string, @Body() dto: CreateContainerDto) {
    return this.dtaMaritimeService.addContainer(processoId, dto);
  }

  @Patch('containers/:id')
  @ApiOperation({ summary: 'Atualizar container (campos e/ou BLs)' })
  updateContainer(@Param('id') id: string, @Body() dto: UpdateContainerDto) {
    return this.dtaMaritimeService.updateContainer(id, dto);
  }

  @Delete('containers/:id')
  @ApiOperation({ summary: 'Remover container' })
  deleteContainer(@Param('id') id: string) {
    return this.dtaMaritimeService.deleteContainer(id);
  }

  // ========== BILL OF LADINGS ==========

  @Post('processos/:id/bls')
  @ApiOperation({ summary: 'Adicionar BL avulso a uma DTA' })
  addBl(@Param('id') processoId: string, @Body('numero') numero: string) {
    return this.dtaMaritimeService.addBl(processoId, numero);
  }

  @Delete('bls/:id')
  @ApiOperation({ summary: 'Remover BL' })
  deleteBl(@Param('id') id: string) {
    return this.dtaMaritimeService.deleteBl(id);
  }
}
