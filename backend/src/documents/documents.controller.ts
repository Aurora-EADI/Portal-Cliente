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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client-postgres';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post('upload')
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
  @Roles(UserRole.ADMIN)
  async findAll(@Query('latestOnly') latestOnly: string = 'true') {
    return this.documentsService.findAll(latestOnly === 'true');
  }

  @Get('company/:companyId')
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

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.documentsService.updateStatus(id, dto);
  }

  @Get(':id/download')
  async getDownloadUrl(@Param('id') id: string) {
    const url = await this.documentsService.getFileUrl(id);
    return { url };
  }
}