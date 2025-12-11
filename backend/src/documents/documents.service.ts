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

            // 2. Depois grava no banco - se falhar, rollback
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
                },
            });

            return document;
        });
    }


    async findAll() {
        return this.prisma.document.findMany({
            include: {
                user: { select: { name: true, email: true } },
                company: { select: { fantasyName: true } },
            },
            orderBy: { uploadedAt: 'desc' },
        });
    }

    async findByCompany(companyId: string) {
        return this.prisma.document.findMany({
            where: { companyId },
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
