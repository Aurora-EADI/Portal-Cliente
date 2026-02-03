import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client-postgres";

@Injectable()
export class DocumentTypesService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.DocumentTypeCreateInput) {
    return this.prisma.documentType.create({ data });
  }

  findAll() {
    return this.prisma.documentType.findMany({
      orderBy: { name: "asc" },
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

  async remove(id: number) {
    // Verificar se há documentos usando este tipo
    const documentsCount = await this.prisma.document.count({
      where: { documentTypeId: id },
    });

    if (documentsCount > 0) {
      throw new BadRequestException(
        `Não é possível deletar tipo de documento com ${documentsCount} documento(s) vinculado(s). ` +
          `Use o campo 'active' para desativar ao invés de deletar.`,
      );
    }

    // Verificar se há requisitos de empresas vinculados
    const requirementsCount =
      await this.prisma.companyDocumentRequirement.count({
        where: { documentTypeId: id },
      });

    if (requirementsCount > 0) {
      throw new BadRequestException(
        `Não é possível deletar tipo de documento com ${requirementsCount} requisito(s) de empresa(s). ` +
          `Use o campo 'active' para desativar ao invés de deletar.`,
      );
    }

    // Se passou por todas as verificações, pode deletar
    return this.prisma.documentType.delete({ where: { id } });
  }
}
