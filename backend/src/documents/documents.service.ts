import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaPostgresService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class DocumentsService {
    constructor(
        private prisma: PrismaPostgresService,
        private minio: MinioService,
    ) { }

    async uploadDocument(
        file: Express.Multer.File,
        dto: UploadDocumentDto,
        userId: string,
    ) {
        // Gerar nome único
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname}`;

        if (!dto.companyId) {
            throw new BadRequestException('companyId é obrigatório');
        }

        return await this.prisma.$transaction(async (tx) => {
            // 1. Primeiro tenta subir o arquivo (externo ao DB, não rollback automático)
            try {
                await this.minio.uploadFile(file, fileName);
            } catch (error) {
                throw new BadRequestException('Erro ao enviar arquivo ao MinIO');
            }

            // 2. Marcar documentos anteriores do mesmo tipo/nome como isLatest: false
            if (dto.documentTypeId) {
                // Documentos COM tipo: versiona por tipo
                await tx.document.updateMany({
                    where: {
                        companyId: dto.companyId,
                        documentTypeId: Number(dto.documentTypeId),
                        isLatest: true
                    },
                    data: { isLatest: false }
                });
            } else {
                // Documentos SEM tipo: versiona por nome
                await tx.document.updateMany({
                    where: {
                        companyId: dto.companyId,
                        documentTypeId: null,
                        name: dto.name,
                        isLatest: true
                    },
                    data: { isLatest: false }
                });
            }

            // 3. Criar novo documento como isLatest: true
            const document = await tx.document.create({
                data: {
                    name: dto.name,
                    fileType: file.mimetype.split('/')[1],
                    fileUrl: fileName,
                    userId,
                    companyId: dto.companyId,
                    status: 'PENDING',
                    dateIssue: dto.dateIssue ? new Date(dto.dateIssue) : undefined,
                    dateExpiration: dto.dateExpiration ? new Date(dto.dateExpiration) : undefined,
                    documentTypeId: dto.documentTypeId ? Number(dto.documentTypeId) : null,
                    isLatest: true,
                },
            });

            return document;
        });
    }


    async findAll(latestOnly: boolean = true) {
        return this.prisma.document.findMany({
            where: latestOnly ? { isLatest: true } : undefined,
            include: {
                user: { select: { name: true, email: true } },
                company: { select: { fantasyName: true } },
            },
            orderBy: { uploadedAt: 'desc' },
        });
    }

    async findByCompany(companyId: string, latestOnly: boolean = false) {
        return this.prisma.document.findMany({
            where: latestOnly
                ? { companyId, isLatest: true }
                : { companyId },
            orderBy: { uploadedAt: 'desc' },
        });
    }

    async updateStatus(id: string, dto: UpdateStatusDto) {
        return this.prisma.document.update({
            where: { id },
            data: {
                status: dto.status,
                rejectionReason: dto.rejectionReason,
            },
        });
    }

    async getFileUrl(id: string) {
        const document = await this.prisma.document.findUnique({ where: { id } });
        if (!document) throw new Error('Documento não encontrado');
        return this.minio.getFileUrl(document.fileUrl);
    }
}
