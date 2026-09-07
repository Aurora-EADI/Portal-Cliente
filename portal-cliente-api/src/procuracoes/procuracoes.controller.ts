import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ProcuracaoStatus, User, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ServiceKeyGuard } from '../common/guards/service-key.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TAMANHO_MAXIMO_BYTES } from '../common/arquivo';
import { ProcuracoesService } from './procuracoes.service';
import { CriarProcuracaoDto } from './dto/criar-procuracao.dto';
import {
  AprovarProcuracaoDto,
  ReprovarProcuracaoDto,
} from './dto/decidir-procuracao.dto';

function enviarPdf(res: Response, nome: string, stream: NodeJS.ReadableStream) {
  res.setHeader('Content-Type', 'application/pdf');
  // inline: o revisor abre no visualizador em vez de baixar.
  // encodeURIComponent porque o nome vem do usuário e pode ter acento.
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(nome)}`,
  );
  stream.pipe(res);
}

@Controller('procuracoes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcuracoesController {
  constructor(private readonly service: ProcuracoesService) {}

  @Get()
  @Roles(UserRole.DESPACHANTE)
  listar(@Req() req: Request) {
    return this.service.listarDoDespachante(req.user as User);
  }

  @Get('clientes-autorizados')
  @Roles(UserRole.DESPACHANTE)
  clientesAutorizados(@Req() req: Request) {
    return this.service.clientesAutorizados(req.user as User);
  }

  @Post()
  @Roles(UserRole.DESPACHANTE)
  @HttpCode(HttpStatus.CREATED)
  // Upload é caro e fica exposto na internet: 10 por minuto por IP.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: TAMANHO_MAXIMO_BYTES },
      fileFilter: (_req, file, cb) => {
        // Primeira barreira, barata. A que vale é a dos magic bytes no service.
        if (file.mimetype !== 'application/pdf') {
          return cb(new Error('Envie o documento em PDF'), false);
        }
        cb(null, true);
      },
    }),
  )
  enviar(
    @Req() req: Request,
    @Body() dto: CriarProcuracaoDto,
    @UploadedFile() arquivo?: Express.Multer.File,
  ) {
    return this.service.enviar(req.user as User, dto.clienteId, arquivo);
  }

  @Get(':id/arquivo')
  @Roles(UserRole.DESPACHANTE, UserRole.CLIENTE)
  async arquivo(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { stream, nome } = await this.service.abrirArquivo(
      id,
      req.user as User,
    );
    enviarPdf(res, nome, stream);
  }
}

/**
 * Fila de análise, consumida só pelo Portal Aurora.
 *
 * O PDF sai daqui por streaming, nunca por URL presigned: uma URL assinada é
 * link portátil que entrega o documento a quem a receber, sem passar por guard.
 */
@Controller('service/procuracoes')
@UseGuards(ServiceKeyGuard)
export class ProcuracoesServiceController {
  constructor(private readonly service: ProcuracoesService) {}

  @Get()
  listar(
    @Query('status', new ParseEnumPipe(ProcuracaoStatus, { optional: true }))
    status?: ProcuracaoStatus,
  ) {
    return this.service.listarParaAnalise(status);
  }

  @Get(':id/arquivo')
  async arquivo(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { stream, nome } = await this.service.abrirArquivo(id);
    enviarPdf(res, nome, stream);
  }

  @Patch(':id/aprovar')
  aprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AprovarProcuracaoDto,
  ) {
    return this.service.aprovar(id, dto.analisadoPor);
  }

  @Patch(':id/reprovar')
  reprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReprovarProcuracaoDto,
  ) {
    return this.service.reprovar(id, dto.motivo, dto.analisadoPor);
  }
}
