import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { MinioService } from "../minio/minio.service";
import { DocumentStatus, UserRole } from "@prisma/client";
import { UploadWorkforceDocumentDto } from "./dto/upload-workforce-document.dto";
import { UpdateWorkforceDocumentStatusDto } from "./dto/update-workforce-document-status.dto";

type AuthUser = { id: string; role: UserRole; companyId?: string | null };

@Injectable()
export class WorkforceDocumentsService {
  private readonly logger = new Logger(WorkforceDocumentsService.name);

  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly minio: MinioService,
  ) {}

  private async getEmployeeWithScope(employeeId: string, user: AuthUser) {
    const employee = await this.prisma.companyEmployee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException("Colaborador terceirizado nao encontrado");
    }

    if (
      user.role === UserRole.SUPPLIER &&
      (!user.companyId || user.companyId !== employee.companyId)
    ) {
      throw new ForbiddenException(
        "Voce nao tem permissao para acessar colaborador de outra empresa",
      );
    }


    return employee;
  }

  private async getEffectiveRequiredTypeIds(companyId: string) {
    const [companyRequirements, globalRequirements] = await Promise.all([
      this.prisma.workforceDocumentRequirement.findMany({
        where: {
          companyId,
          active: true,
          isRequired: true,
        },
        select: {
          documentTypeId: true,
        },
      }),
      this.prisma.globalWorkforceDocumentRequirement.findMany({
        where: {
          active: true,
          isRequired: true,
        },
        select: {
          documentTypeId: true,
        },
      }),
    ]);

    const mergedIds = new Set<number>([
      ...globalRequirements.map((item) => item.documentTypeId),
      ...companyRequirements.map((item) => item.documentTypeId),
    ]);

    return Array.from(mergedIds);
  }

  async uploadDocument(
    file: Express.Multer.File,
    dto: UploadWorkforceDocumentDto,
    user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException("Arquivo nao informado");
    }

    const employee = await this.getEmployeeWithScope(
      dto.companyEmployeeId,
      user,
    );
    const timestamp = Date.now();
    const fileName = `workforce/${employee.companyId}/${employee.id}/${timestamp}-${file.originalname}`;

    return this.prisma.$transaction(async (tx) => {
      try {
        await this.minio.uploadFile(file, fileName);
      } catch (error: any) {
        this.logger.error(
          `Erro no upload para o MinIO (${fileName}): ${error.message}`,
        );
        throw new BadRequestException("Erro ao enviar arquivo ao MinIO");
      }

      if (dto.documentTypeId) {
        await tx.workforceDocument.updateMany({
          where: {
            companyEmployeeId: employee.id,
            documentTypeId: Number(dto.documentTypeId),
            isLatest: true,
          },
          data: { isLatest: false },
        });
      } else {
        await tx.workforceDocument.updateMany({
          where: {
            companyEmployeeId: employee.id,
            documentTypeId: null,
            name: dto.name,
            isLatest: true,
          },
          data: { isLatest: false },
        });
      }

      return tx.workforceDocument.create({
        data: {
          companyEmployeeId: employee.id,
          companyId: employee.companyId,
          uploadedByUserId: user.id,
          name: dto.name,
          fileType: file.mimetype.split("/")[1],
          fileUrl: fileName,
          status: DocumentStatus.PENDING,
          dateIssue: dto.dateIssue ? new Date(dto.dateIssue) : undefined,
          dateExpiration: dto.dateExpiration
            ? new Date(dto.dateExpiration)
            : undefined,
          documentTypeId: dto.documentTypeId
            ? Number(dto.documentTypeId)
            : null,
          isLatest: true,
        },
        include: {
          documentType: true,
        },
      });
    });
  }

  async listByEmployee(
    employeeId: string,
    latestOnly: boolean,
    user: AuthUser,
  ) {
    await this.getEmployeeWithScope(employeeId, user);

    return this.prisma.workforceDocument.findMany({
      where: latestOnly
        ? {
            companyEmployeeId: employeeId,
            isLatest: true,
          }
        : { companyEmployeeId: employeeId },
      include: {
        documentType: true,
      },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateWorkforceDocumentStatusDto,
    user: AuthUser,
  ) {
    const existing = await this.prisma.workforceDocument.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Documento de colaborador nao encontrado");
    }

    if (
      user.role === UserRole.SUPPLIER &&
      user.companyId &&
      user.companyId !== existing.companyId
    ) {
      throw new ForbiddenException(
        "Voce nao tem permissao para atualizar este documento",
      );
    }

    return this.prisma.workforceDocument.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
      },
    });
  }

  async getFileUrl(id: string, user: AuthUser) {
    const document = await this.prisma.workforceDocument.findUnique({
      where: { id },
      select: {
        fileUrl: true,
        companyId: true,
      },
    });

    if (!document) {
      throw new NotFoundException("Documento de colaborador nao encontrado");
    }

    if (
      user.role === UserRole.SUPPLIER &&
      user.companyId &&
      user.companyId !== document.companyId
    ) {
      throw new ForbiddenException(
        "Voce nao tem permissao para acessar este documento",
      );
    }

    return this.minio.getFileUrl(document.fileUrl);
  }

  async getMissingRequirements(employeeId: string, user: AuthUser) {
    const employee = await this.getEmployeeWithScope(employeeId, user);
    const requiredTypeIds = await this.getEffectiveRequiredTypeIds(
      employee.companyId,
    );

    const [requirements, documents] = await Promise.all([
      this.prisma.documentType.findMany({
        where: {
          id: { in: requiredTypeIds },
          active: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      this.prisma.workforceDocument.findMany({
        where: {
          companyEmployeeId: employee.id,
          isLatest: true,
          status: { not: DocumentStatus.REJECTED },
          documentTypeId: { not: null },
        },
        select: {
          documentTypeId: true,
        },
      }),
    ]);

    const existingTypeIds = new Set(
      documents
        .map((doc) => doc.documentTypeId)
        .filter((id): id is number => id !== null),
    );

    return requirements
      .filter((documentType) => !existingTypeIds.has(documentType.id))
      .map((documentType) => ({
        id: `${employee.companyId}:${documentType.id}`,
        companyId: employee.companyId,
        documentTypeId: documentType.id,
        isRequired: true,
        active: true,
        documentType,
      }));
  }
}
