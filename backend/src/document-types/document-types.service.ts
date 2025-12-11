import { Injectable } from '@nestjs/common';
import { PrismaPostgresService as PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client-postgres';

@Injectable()
export class DocumentTypesService {
    constructor(private prisma: PrismaService) { }

    create(data: Prisma.DocumentTypeCreateInput) {
        return this.prisma.documentType.create({ data });
    }

    findAll() {
        return this.prisma.documentType.findMany({
            orderBy: { name: 'asc' },
        });
    }

    findOne(id: number) {
        return this.prisma.documentType.findUnique({ where: { id } });
    }

    update(id: number, data: Prisma.DocumentTypeUpdateInput) {
        return this.prisma.documentType.update({
            where: { id },
            data,
        });
    }

    remove(id: number) {
        return this.prisma.documentType.delete({ where: { id } });
    }
}
