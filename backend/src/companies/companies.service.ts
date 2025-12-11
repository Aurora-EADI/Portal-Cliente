import { Injectable } from '@nestjs/common';
import { PrismaPostgresService } from '../prisma/prisma.service';
import { CompanyStatus } from '@prisma/client-postgres';
import { CreateCompanyDto } from './dto/create-companies.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaPostgresService) { }

  async create(createCompaniesDTO: CreateCompanyDto) {
    return this.prisma.company.create({
      data: createCompaniesDTO
    })
  }

  async getAll() {
    return this.prisma.company.findMany()
  }

  async getAllWithResponsible() {
    const companies = await this.prisma.company.findMany({
      include: {
        users: {
          where: {
            role: 'SUPPLIER', // Busca apenas o usuário responsável (SUPPLIER)
          },
          take: 1, // Pega apenas o primeiro responsável
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formata o retorno para o formato esperado pelo frontend
    return companies.map((company) => ({
      company: {
        id: company.id,
        cnpj: company.cnpj,
        fantasyName: company.fantasyName,
        socialReason: company.socialReason,
        zipCode: company.zipCode,
        address: company.address,
        number: company.number,
        complement: company.complement,
        neighborhood: company.neighborhood,
        city: company.city,
        state: company.state,
        phone: company.phone,
        status: company.status,
        createdAt: company.createdAt.toISOString(),
      },
      responsible: company.users[0]
        ? {
          id: company.users[0].id,
          name: company.users[0].name,
          email: company.users[0].email,
          role: company.users[0].role,
          companyId: company.users[0].companyId,
        }
        : null,
    }));
  }

  async updateStatus(id: string, status: CompanyStatus) {
    return this.prisma.company.update({
      where: { id },
      data: { status },
    });
  }

  async getRequirements(companyId: string) {
    return this.prisma.companyDocumentRequirement.findMany({
      where: { companyId },
      include: {
        documentType: true,
      },
    });
  }

  async updateRequirements(companyId: string, requirements: { documentTypeId: number; isRequired: boolean }[]) {
    // Transaction to ensure consistency
    return this.prisma.$transaction(
      requirements.map((req) =>
        this.prisma.companyDocumentRequirement.upsert({
          where: {
            companyId_documentTypeId: {
              companyId,
              documentTypeId: req.documentTypeId,
            },
          },
          update: {
            isRequired: req.isRequired,
          },
          create: {
            companyId,
            documentTypeId: req.documentTypeId,
            isRequired: req.isRequired,
          },
        }),
      ),
    );
  }
}
