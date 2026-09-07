import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Modalidade, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ServiceKeyGuard } from '../common/guards/service-key.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TiposDocumentoService } from './tipos-documento.service';
import { ReplicarTiposDocumentoDto } from './dto/replicar-tipos-documento.dto';

/** Leitura do catálogo pelo usuário externo. */
@Controller('tipos-documento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TiposDocumentoController {
  constructor(private readonly service: TiposDocumentoService) {}

  @Get()
  @Roles(
    UserRole.DESPACHANTE,
    UserRole.CLIENTE,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
  )
  // Sem o pipe, uma modalidade inexistente chega crua no Prisma e vira 500.
  // Entrada de usuario tem que virar 400.
  listar(
    @Query('modalidade', new ParseEnumPipe(Modalidade, { optional: true }))
    modalidade?: Modalidade,
  ) {
    return this.service.listar(modalidade);
  }
}

/**
 * Escrita, só server-to-server: não há usuário nem cookie neste caminho, quem
 * autentica é o ServiceKeyGuard. Note que o JwtAuthGuard não é global neste
 * app — cada controller declara os seus, então basta não pedi-lo aqui.
 */
@Controller('service/tipos-documento')
@UseGuards(ServiceKeyGuard)
export class TiposDocumentoServiceController {
  constructor(private readonly service: TiposDocumentoService) {}

  @Put('batch')
  @HttpCode(HttpStatus.OK)
  replicar(@Body() dto: ReplicarTiposDocumentoDto) {
    return this.service.replicar(dto.tipos);
  }
}
