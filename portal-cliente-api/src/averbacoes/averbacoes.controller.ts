import {
  Body,
  Controller,
  Delete,
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
import { AverbacaoProcessoStatus, User, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ServiceKeyGuard } from '../common/guards/service-key.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TAMANHO_MAXIMO_BYTES } from '../common/arquivo';
import { AverbacoesService } from './averbacoes.service';
import { CriarAverbacaoDto } from './dto/criar-averbacao.dto';
import { EditarAverbacaoDto } from './dto/editar-averbacao.dto';
import { CancelarAverbacaoDto } from './dto/cancelar-averbacao.dto';
import {
  AprovarDocumentoDto,
  DesvincularLoteDto,
  LiberarProcessoDto,
  RejeitarDocumentoDto,
  VincularLoteDto,
} from './dto/decidir-documento.dto';

function enviarPdf(res: Response, nome: string, stream: NodeJS.ReadableStream) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(nome)}`,
  );
  stream.pipe(res);
}

@Controller('averbacoes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AverbacoesController {
  constructor(private readonly service: AverbacoesService) {}

  @Get()
  @Roles(UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.ADMIN, UserRole.EMPLOYEE)
  listar(@Req() req: Request) {
    return this.service.listar(req.user as User);
  }

  @Get(':id')
  @Roles(UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.ADMIN, UserRole.EMPLOYEE)
  detalhar(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.service.detalhar(id, req.user as User);
  }

  @Post()
  @Roles(UserRole.DESPACHANTE)
  @HttpCode(HttpStatus.CREATED)
  criar(@Req() req: Request, @Body() dto: CriarAverbacaoDto) {
    return this.service.criar(req.user as User, dto);
  }

  /** Corrige dados de identificação digitados errado na abertura. */
  @Patch(':id')
  @Roles(UserRole.DESPACHANTE)
  editar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Body() dto: EditarAverbacaoDto,
  ) {
    return this.service.editar(id, req.user as User, dto);
  }

  /** Descarta um processo aberto por engano. Não apaga: marca CANCELADO. */
  @Delete(':id')
  @Roles(UserRole.DESPACHANTE)
  cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Body() dto: CancelarAverbacaoDto,
  ) {
    return this.service.cancelar(id, req.user as User, dto.motivo);
  }

  @Post(':id/documentos/:tipoId')
  @Roles(UserRole.DESPACHANTE)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: TAMANHO_MAXIMO_BYTES },
      fileFilter: (_req, file, cb) => {
        // Barreira barata; a que vale é a dos magic bytes no service.
        if (file.mimetype !== 'application/pdf') {
          return cb(new Error('Envie o documento em PDF'), false);
        }
        cb(null, true);
      },
    }),
  )
  enviarDocumento(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tipoId', ParseUUIDPipe) tipoId: string,
    @Req() req: Request,
    @UploadedFile() arquivo?: Express.Multer.File,
  ) {
    return this.service.enviarDocumento(req.user as User, id, tipoId, arquivo);
  }

  @Get('documentos/:docId/arquivo')
  @Roles(UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.ADMIN, UserRole.EMPLOYEE)
  async arquivo(
    @Param('docId', ParseUUIDPipe) docId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { stream, nome } = await this.service.abrirArquivo(
      docId,
      req.user as User,
    );
    enviarPdf(res, nome, stream);
  }
}

/** Fila de validação, consumida só pelo Portal Aurora. */
@Controller('service/averbacoes')
@UseGuards(ServiceKeyGuard)
export class AverbacoesServiceController {
  constructor(private readonly service: AverbacoesService) {}

  @Get()
  listar(
    @Query('status', new ParseEnumPipe(AverbacaoProcessoStatus, { optional: true }))
    status?: AverbacaoProcessoStatus,
  ) {
    return this.service.listarParaValidacao(status);
  }

  /**
   * Fila de vinculação: processos que ainda não apontam para um lote do SIAUM.
   *
   * Declarado antes de `:id` de propósito — "sem-vinculo" casaria com o
   * parâmetro e o ParseUUIDPipe o recusaria como UUID inválido.
   */
  @Get('sem-vinculo')
  semVinculo() {
    return this.service.listarSemVinculo();
  }

  @Get(':id')
  detalhar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detalhar(id);
  }

  @Get('documentos/:docId/arquivo')
  async arquivo(
    @Param('docId', ParseUUIDPipe) docId: string,
    @Res() res: Response,
  ) {
    const { stream, nome } = await this.service.abrirArquivo(docId);
    enviarPdf(res, nome, stream);
  }

  @Patch('documentos/:docId/aprovar')
  aprovar(
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() dto: AprovarDocumentoDto,
  ) {
    return this.service.aprovarDocumento(docId, dto.analisadoPor);
  }

  @Patch('documentos/:docId/rejeitar')
  rejeitar(
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() dto: RejeitarDocumentoDto,
  ) {
    return this.service.rejeitarDocumento(docId, dto.motivo, dto.analisadoPor);
  }

  /** Amarra o processo ao registro do SIAUM. Decisão do analista, não busca. */
  @Patch(':id/vinculo')
  vincular(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VincularLoteDto,
  ) {
    return this.service.vincularLote(id, dto.nLote, dto.vinculadoPor);
  }

  /**
   * Desfaz o vínculo. É DELETE com corpo porque o motivo é obrigatório — a
   * alternativa seria mandá-lo na query string, onde ele acabaria em log de
   * acesso e histórico de proxy.
   */
  @Delete(':id/vinculo')
  desvincular(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DesvincularLoteDto,
  ) {
    return this.service.desvincularLote(id, dto.motivo, dto.vinculadoPor);
  }

  @Post(':id/liberar')
  @HttpCode(HttpStatus.OK)
  liberar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LiberarProcessoDto,
  ) {
    return this.service.liberar(id, dto.analisadoPor, dto.nLote);
  }
}
