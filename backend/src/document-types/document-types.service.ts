import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class DocumentTypesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.DocumentTypeCreateInput) {
    try {
      return await this.prisma.documentType.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Já existe um tipo de documento com este nome.');
        }
      }
      throw error;
    }
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
    const documentsCount = await this.prisma.document.count({
      where: { documentTypeId: id },
    });

    if (documentsCount > 0) {
      throw new BadRequestException(
        `Nao e possivel deletar tipo de documento com ${documentsCount} documento(s) vinculado(s). Use o campo 'active' para desativar.`,
      );
    }

    const requirementsCount =
      await this.prisma.companyDocumentRequirement.count({
        where: { documentTypeId: id },
      });

    if (requirementsCount > 0) {
      throw new BadRequestException(
        `Nao e possivel deletar tipo de documento com ${requirementsCount} requisito(s) de empresa vinculados.`,
      );
    }

    const rulesCount = await this.prisma.documentRequirementRuleItem.count({
      where: { documentTypeId: id },
    });

    if (rulesCount > 0) {
      throw new BadRequestException(
        `Nao e possivel deletar tipo de documento com ${rulesCount} regra(s) de obrigatoriedade vinculada(s).`,
      );
    }

    return this.prisma.documentType.delete({ where: { id } });
  }
}
