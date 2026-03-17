import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { UploadWorkforceDocumentDto } from "./dto/upload-workforce-document.dto";
import { UpdateWorkforceDocumentStatusDto } from "./dto/update-workforce-document-status.dto";
import { WorkforceDocumentsService } from "./workforce-documents.service";

@ApiTags("Documentos de Colaboradores")
@ApiBearerAuth()
@Controller("workforce-documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkforceDocumentsController {
  constructor(
    private readonly workforceDocumentsService: WorkforceDocumentsService,
  ) {}

  @Post("upload")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  @ApiOperation({ summary: "Fazer upload de documento de colaborador" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadWorkforceDocumentDto })
  @ApiResponse({ status: 201, description: "Documento enviado com sucesso" })
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadWorkforceDocumentDto,
    @Request() req: { user: any },
  ) {
    return this.workforceDocumentsService.uploadDocument(file, dto, req.user);
  }

  @Get("employee/:employeeId")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  @ApiOperation({ summary: "Listar documentos de um colaborador" })
  async listByEmployee(
    @Param("employeeId") employeeId: string,
    @Query("latestOnly") latestOnly: string = "false",
    @Request() req: { user: any },
  ) {
    return this.workforceDocumentsService.listByEmployee(
      employeeId,
      latestOnly === "true",
      req.user,
    );
  }

  @Get("employee/:employeeId/missing")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  @ApiOperation({
    summary: "Listar documentos exigidos pendentes de um colaborador",
  })
  async getMissingRequirements(
    @Param("employeeId") employeeId: string,
    @Request() req: { user: any },
  ) {
    return this.workforceDocumentsService.getMissingRequirements(
      employeeId,
      req.user,
    );
  }

  @Patch(":id/status")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Atualizar status do documento de colaborador" })
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateWorkforceDocumentStatusDto,
    @Request() req: { user: any },
  ) {
    if (
      dto.status === "REJECTED" &&
      (!dto.rejectionReason || !dto.rejectionReason.trim())
    ) {
      throw new BadRequestException(
        "Informe o motivo da rejeicao para status REJECTED",
      );
    }
    return this.workforceDocumentsService.updateStatus(id, dto, req.user);
  }

  @Get(":id/download")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  @ApiOperation({ summary: "Obter URL de download de documento de colaborador" })
  async getDownloadUrl(@Param("id") id: string, @Request() req: { user: any }) {
    const url = await this.workforceDocumentsService.getFileUrl(id, req.user);
    return { url };
  }
}

