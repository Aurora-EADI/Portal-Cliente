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
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { DocumentsService } from "./documents.service";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { OverdueDocumentsQueryDto } from "./dto/overdue-documents-query.dto";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("Documentos")
@ApiBearerAuth()
@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post("upload")
  @ApiOperation({ summary: "Fazer upload de um documento" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Documento enviado com sucesso" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Request()
    req: { user: { id: string; role: UserRole; companyId?: string } },
  ) {
    return this.documentsService.uploadDocument(file, dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos os documentos (Admin)" })
  @ApiResponse({
    status: 200,
    description: "Lista de documentos retornada com sucesso",
  })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll(@Query("latestOnly") latestOnly: string = "true") {
    return this.documentsService.findAll(latestOnly === "true");
  }

  @Get("company/:companyId")
  @ApiOperation({ summary: "Listar documentos por empresa" })
  @ApiResponse({
    status: 200,
    description: "Documentos da empresa retornados com sucesso",
  })
  @ApiResponse({
    status: 403,
    description: "Sem permissão para acessar documentos desta empresa",
  })
  async findByCompany(
    @Param("companyId") companyId: string,
    @Query("latestOnly") latestOnly: string = "false",
    @Request() req: { user: { id: string; role: string; companyId?: string } },
  ) {
    // 1. Verifica permissão: Admin e Employee podem ver tudo, Supplier só vê sua própria empresa
    if (
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.EMPLOYEE &&
      req.user.companyId !== companyId
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar documentos desta empresa",
      );
    }

    return this.documentsService.findByCompany(
      companyId,
      latestOnly === "true",
    );
  }

  @Get("overdue")
  @ApiOperation({ summary: "Listar documentos vencidos" })
  @ApiResponse({
    status: 200,
    description: "Lista de documentos vencidos retornada com sucesso",
  })
  async findOverdueDocuments(
    @Query() query: OverdueDocumentsQueryDto,
    @Request() req: { user: { id: string; role: string; companyId?: string } },
  ) {
    // Admin e Employee podem ver todos os documentos atrasados (geral)
    // Usuário comum só pode ver documentos da sua própria empresa
    if (
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.EMPLOYEE
    ) {
      // Se não for admin, força o filtro pela empresa do usuário
      query.companyId = req.user.companyId;
    }

    return this.documentsService.findOverdueDocuments(query);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Atualizar status do documento (Admin)" })
  @ApiResponse({
    status: 200,
    description: "Status do documento atualizado com sucesso",
  })
  @ApiResponse({ status: 404, description: "Documento não encontrado" })
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.documentsService.updateStatus(id, dto);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Fazer download do documento" })
  @ApiResponse({
    status: 200,
    description: "Download do documento via streaming",
  })
  @ApiResponse({ status: 404, description: "Documento não encontrado" })
  async downloadFile(
    @Param("id") id: string,
    @Res() res: Response,
    @Request()
    req: { user: { id: string; role: UserRole; companyId?: string } },
  ) {
    // Obtém stream do arquivo via MinIO (acesso interno)
    const { stream, filename, contentType, size } =
      await this.documentsService.getFileStream(id, req.user);

    // Define headers para download
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", size);

    // Faz streaming do arquivo para o cliente
    stream.pipe(res);
  }
}
