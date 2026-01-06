import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaPostgresService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { OverdueDocumentsQueryDto } from './dto/overdue-documents-query.dto';
import { Prisma } from '@prisma/client-postgres';

@Injectable()
export class DocumentsService {
    private readonly logger = new Logger(DocumentsService.name);

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
                this.logger.log(`Iniciando upload para o MinIO: ${fileName}`);
                await this.minio.uploadFile(file, fileName);
                this.logger.log(`Upload para o MinIO concluído: ${fileName}`);
            } catch (error) {
                this.logger.error(`Erro no upload para o MinIO (${fileName}): ${error.message}`, error.stack);
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
        if (!document) throw new NotFoundException('Documento não encontrado no banco de dados');

        try {
            return await this.minio.getFileUrl(document.fileUrl);
        } catch (error) {
            this.logger.error(`Erro ao gerar URL do MinIO para o arquivo ${document.fileUrl}:`, error);
            throw new InternalServerErrorException('Erro ao recuperar o arquivo do servidor de armazenamento (MinIO)');
        }
    }

    async findOverdueDocuments(query: OverdueDocumentsQueryDto) {
        const { page = 1, limit = 10, companyId, sortBy = 'dateExpiration', sortOrder = 'asc', search } = query;
        const skip = (page - 1) * limit;

        // Construir cláusula WHERE
        const where: Prisma.DocumentWhereInput = {
            dateExpiration: {
                lt: new Date(), // Menor que a data atual (atrasados)
            },
            status: {
                not: 'REJECTED', // Não mostrar documentos rejeitados
            },
            isLatest: true, // Apenas versões mais recentes
        };

        // Filtro por empresa (opcional)
        if (companyId) {
            where.companyId = companyId;
        }

        // Filtro de busca (opcional)
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { company: { fantasyName: { contains: search, mode: 'insensitive' } } },
                { documentType: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        // Construir cláusula ORDER BY
        const orderBy: Prisma.DocumentOrderByWithRelationInput = {};
        if (sortBy === 'dateExpiration') {
            orderBy.dateExpiration = sortOrder;
        } else if (sortBy === 'uploadedAt') {
            orderBy.uploadedAt = sortOrder;
        } else if (sortBy === 'name') {
            orderBy.name = sortOrder;
        }

        // Executar queries em paralelo para otimização
        const [documents, total] = await Promise.all([
            this.prisma.document.findMany({
                where,
                include: {
                    company: {
                        select: {
                            id: true,
                            fantasyName: true,
                            cnpj: true,
                            city: true,
                            state: true,
                        },
                    },
                    documentType: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.document.count({ where }),
        ]);

        // Calcular informações de paginação
        const totalPages = Math.ceil(total / limit);

        // Calcular quantos dias de atraso
        const documentsWithDelay = documents.map(doc => {
            const daysOverdue = doc.dateExpiration
                ? Math.floor((new Date().getTime() - doc.dateExpiration.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            return {
                ...doc,
                daysOverdue,
            };
        });

        return {
            data: documentsWithDelay,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
}
