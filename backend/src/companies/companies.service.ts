import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaPostgresService } from '../prisma/prisma.service';
import { CompanyStatus, Prisma } from '@prisma/client-postgres';
import { CreateCompanyDto } from './dto/create-companies.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateRequirementsDto } from './dto/update-requirements.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaPostgresService) { }

  async create(createCompaniesDTO: CreateCompanyDto) {
    return this.prisma.company.create({
      data: createCompaniesDTO,
    });
  }

  async getAll() {
    return this.prisma.company.findMany();
  }

  async getAllWithResponsible(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', status } = query;

    const skip = (page - 1) * limit;

    // Construir filtros (excluindo PENDING)
    const where = this.buildWhereClause(search, status);

    // Adicionar filtro para excluir PENDING
    const whereWithoutPending: Prisma.CompanyWhereInput = {
      ...where,
      status: {
        not: 'PENDING'
      }
    };

    // Construir ordenação
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // Buscar dados, contagem total e contagem por status em paralelo
    const [companies, total, statusCounts] = await Promise.all([
      this.prisma.company.findMany({
        where: whereWithoutPending, // Usar o mesmo where
        include: {
          users: {
            where: { role: 'SUPPLIER' },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.company.count({ where: whereWithoutPending }), // Usar o mesmo where aqui
      this.getStatusCounts(search),
    ]);

    // Formatar dados
    const data = companies.map((company) => this.formatCompanyResponse(company));

    // Calcular metadados
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      statusCounts,
    };
  }

  async getActiveCompanies(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const skip = (page - 1) * limit;

    // Força status ACTIVE
    const where = this.buildWhereClause(search, CompanyStatus.ACTIVE);

    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: companies.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString()
      })),
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

  async findByCnpj(cnpj: string) {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    const company = await this.prisma.company.findFirst({
      where: {
        cnpj: { contains: cleanCnpj },
        status: { in: ['PENDING', 'PENDING_ACTIVE'] },
      },
      include: {
        users: {
          where: { role: 'SUPPLIER' },
          select: { id: true },
        },
      },
    });

    if (!company) {
      return null;
    }

    const { users, ...companyData } = company;

    return {
      ...companyData,
      hasUser: users.length > 0,
    };
  }

  async updateStatus(id: string, status: CompanyStatus) {
    try {
      return await this.prisma.company.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
      }
      throw error;
    }
  }

  async getRequirements(companyId: string) {
    const requirements = await this.prisma.companyDocumentRequirement.findMany({
      where: { companyId },
      include: {
        documentType: true,
      },
    });

    if (!requirements.length) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException(`Empresa com ID ${companyId} não encontrada`);
      }
    }

    return requirements;
  }

  async updateRequirements(companyId: string, updateDto: UpdateRequirementsDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID ${companyId} não encontrada`);
    }

    return this.prisma.$transaction(
      updateDto.requirements.map((req) =>
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

  // ==================== MÉTODOS PRIVADOS ====================

  private async getStatusCounts(search?: string) {
    // Construir where apenas com busca (sem filtro de status)
    const baseWhere = this.buildWhereClause(search, undefined);

    // Adicionar filtro para excluir PENDING
    const whereWithoutPending: Prisma.CompanyWhereInput = {
      ...baseWhere,
      status: {
        not: 'PENDING'
      }
    };

    // Buscar contagem agrupada por status
    const counts = await this.prisma.company.groupBy({
      by: ['status'],
      where: whereWithoutPending,
      _count: {
        status: true,
      },
    });

    // Formatar resultado em objeto { ACTIVE: 25, REJECTED: 5, ... }
    const statusCounts = counts.reduce((acc, item) => {
      if (item._count) {
        acc[item.status] = item._count.status;
      }
      return acc;
    }, {} as Record<string, number>);

    // Garantir que todos os status existam no objeto (exceto PENDING, com valor 0)
    const allStatus = Object.values(CompanyStatus).filter(status => status !== 'PENDING');
    allStatus.forEach((status) => {
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
    });

    return statusCounts;
  }

  private buildWhereClause(search?: string, status?: string): Prisma.CompanyWhereInput {
    const where: Prisma.CompanyWhereInput = {};

    if (search) {
      const orConditions: any[] = [
        { fantasyName: { contains: search, mode: 'insensitive' } },
        { socialReason: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];

      // Só adiciona filtro de CNPJ se houver números no termo de busca
      const cleanedSearch = search.replace(/\D/g, '');
      if (cleanedSearch.length > 0) {
        orConditions.push({ cnpj: { contains: cleanedSearch } });
      }

      where.OR = orConditions;
    }

    if (status) {
      where.status = status as CompanyStatus;
    }

    return where;
  }

  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): Prisma.CompanyOrderByWithRelationInput {
    const validFields = ['createdAt', 'fantasyName', 'socialReason', 'cnpj', 'city', 'status'];
    const field = validFields.includes(sortBy) ? sortBy : 'createdAt';
    return { [field]: sortOrder };
  }

  private formatCompanyResponse(company: any) {
    return {
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
    };
  }
}