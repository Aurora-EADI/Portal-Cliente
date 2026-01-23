import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { OverdueDocumentsQueryDto } from './dto/overdue-documents-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client-postgres';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post('upload')
  @ApiOperation({ summary: 'Fazer upload de um documento' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Documento enviado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Request() req,
  ) {
    // Tente req.user.id ao invés de req.user.userId
    return this.documentsService.uploadDocument(file, dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os documentos (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de documentos retornada com sucesso' })
  @Roles(UserRole.ADMIN)
  async findAll(@Query('latestOnly') latestOnly: string = 'true') {
    return this.documentsService.findAll(latestOnly === 'true');
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Listar documentos por empresa' })
  @ApiResponse({ status: 200, description: 'Documentos da empresa retornados com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar documentos desta empresa' })
  async findByCompany(
    @Param('companyId') companyId: string,
    @Query('latestOnly') latestOnly: string = 'false',
    @Request() req
  ) {
    // 1. Verifica permissão: Admin pode ver tudo, Supplier só vê sua própria empresa
    if (req.user.role !== UserRole.ADMIN && req.user.companyId !== companyId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar documentos desta empresa',
      );
    }

    return this.documentsService.findByCompany(companyId, latestOnly === 'true');
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Listar documentos vencidos' })
  @ApiResponse({ status: 200, description: 'Lista de documentos vencidos retornada com sucesso' })
  async findOverdueDocuments(
    @Query() query: OverdueDocumentsQueryDto,
    @Request() req
  ) {
    // Admin pode ver todos os documentos atrasados (geral)
    // Usuário comum só pode ver documentos da sua própria empresa
    if (req.user.role !== UserRole.ADMIN) {
      // Se não for admin, força o filtro pela empresa do usuário
      query.companyId = req.user.companyId;
    }

    return this.documentsService.findOverdueDocuments(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do documento (Admin)' })
  @ApiResponse({ status: 200, description: 'Status do documento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.documentsService.updateStatus(id, dto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Obter URL de download do documento' })
  @ApiResponse({ status: 200, description: 'URL de download gerada com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async getDownloadUrl(@Param('id') id: string) {
    const url = await this.documentsService.getFileUrl(id);
    return { url };
  }
}