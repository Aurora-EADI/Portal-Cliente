import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { CompanyStatus, Prisma } from "@prisma/client";
import { CreateCompanyDto } from "./dto/create-companies.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { UpdateRequirementsDto } from "./dto/update-requirements.dto";
import { RequestAccessDto } from "./dto/request-access.dto";
import * as bcrypt from "bcrypt";
import { RequirementRulesService } from "../requirement-rules/requirement-rules.service";

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaPostgresService,
    private readonly requirementRulesService: RequirementRulesService,
  ) { }

  async create(createCompaniesDTO: CreateCompanyDto) {
    const {
      supplierTypeIds = [],
      workforceEmployees = [],
      allocationRegime,
      ...companyData
    } = createCompaniesDTO;

    if (supplierTypeIds.length === 0) {
      return this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            ...companyData,
            allocationRegime,
          },
        });

        await this.syncCompanyWorkforce(
          tx,
          company.id,
          allocationRegime,
          workforceEmployees,
        );

        return company;
      });
    }

    const uniqueSupplierTypeIds = [...new Set(supplierTypeIds)];
    const existingSupplierTypes = await this.prisma.supplierType.findMany({
      where: {
        id: { in: uniqueSupplierTypeIds },
        active: true,
      },
      select: { id: true },
    });

    if (existingSupplierTypes.length !== uniqueSupplierTypeIds.length) {
      throw new NotFoundException(
        "Um ou mais tipos de fornecedor nao foram encontrados",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          ...companyData,
          allocationRegime,
        },
      });

      await tx.companySupplierType.createMany({
        data: uniqueSupplierTypeIds.map((supplierTypeId) => ({
          companyId: company.id,
          supplierTypeId,
        })),
      });

      await this.syncCompanyWorkforce(
        tx,
        company.id,
        allocationRegime,
        workforceEmployees,
      );

      return company;
    });
  }

  async getAll() {
    return this.prisma.company.findMany();
  }

  async getAllWithResponsible(query: PaginationQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
    } = query;

    const skip = (page - 1) * limit;

    // Construir filtros base
    const where = this.buildWhereClause(search, status, query.supplierTypeName);

    // Combinar filtro de status com exclusão de PENDING
    let whereWithoutPending: Prisma.CompanyWhereInput;

    if (status) {
      // Se já tem filtro de status, use-o diretamente (e garante que não é PENDING)
      whereWithoutPending = where;
    } else {
      // Se não tem filtro de status, apenas exclua PENDING
      whereWithoutPending = {
        ...where,
        status: {
          not: "PENDING",
        },
      };
    }

    // Construir ordenação
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // Buscar dados, contagem total e contagem por status em paralelo
    const [companies, total, statusCounts] = await Promise.all([
      this.prisma.company.findMany({
        where: whereWithoutPending, // Usar o mesmo where
        include: {
          users: {
            where: { role: "SUPPLIER" },
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
    const data = companies.map((company) =>
      this.formatCompanyResponse(company),
    );

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
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;

    // Força status ACTIVE
    const where = this.buildWhereClause(search, CompanyStatus.ACTIVE, query.supplierTypeName);

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
      data: companies.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
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
    const cleanCnpj = cnpj.replace(/\D/g, "");

    const company = await this.prisma.company.findFirst({
      where: {
        cnpj: { contains: cleanCnpj },
        status: { in: ["PENDING", "PENDING_ACTIVE"] },
      },
      include: {
        users: {
          where: { role: "SUPPLIER" },
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
      if (error.code === "P2025") {
        throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
      }
      throw error;
    }
  }

  async getRequirements(companyId: string) {
    return this.requirementRulesService.getEffectiveRequirementsByCompany(
      companyId,
    );
  }

  async updateRequirements(
    companyId: string,
    updateDto: UpdateRequirementsDto,
  ) {
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

  /**
   * Solicitar acesso: Atualiza empresa existente e usuário SUPPLIER
   * Usado quando o fornecedor já foi cadastrado pelo Protheus e quer solicitar acesso
   */
  async requestAccess(companyId: string, requestAccessDto: RequestAccessDto) {
    const { company, user } = requestAccessDto;

    // Verifica se a empresa existe
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          where: { role: "SUPPLIER" },
        },
      },
    });

    if (!existingCompany) {
      throw new NotFoundException("Empresa não encontrada");
    }

    // Verifica se já existe outro usuário com este email em outra empresa
    const existingUserWithEmail = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (
      existingUserWithEmail &&
      existingUserWithEmail.companyId !== companyId
    ) {
      throw new ConflictException("Email já cadastrado para outra empresa");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Atualiza empresa e usuário em transação
    await this.prisma.$transaction(async (prisma) => {
      // 1. Atualiza dados da empresa
      await prisma.company.update({
        where: { id: companyId },
        data: {
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
          classification: company.classification,
          allocationRegime: company.allocationRegime,
          status: "PENDING_ACTIVE", // Atualiza status para aguardar aprovação
        },
      });

      if (company.supplierTypeIds && company.supplierTypeIds.length > 0) {
        const uniqueSupplierTypeIds = [...new Set(company.supplierTypeIds)];
        const existingSupplierTypes = await prisma.supplierType.findMany({
          where: {
            id: { in: uniqueSupplierTypeIds },
            active: true,
          },
          select: { id: true },
        });

        if (existingSupplierTypes.length !== uniqueSupplierTypeIds.length) {
          throw new NotFoundException(
            "Um ou mais tipos de fornecedor nao foram encontrados",
          );
        }

        await prisma.companySupplierType.deleteMany({
          where: { companyId },
        });

        await prisma.companySupplierType.createMany({
          data: uniqueSupplierTypeIds.map((supplierTypeId) => ({
            companyId,
            supplierTypeId,
          })),
        });
      }
      // 2. Verifica se já existe um usuário SUPPLIER para esta empresa
      await this.syncCompanyWorkforce(
        prisma,
        companyId,
        company.allocationRegime,
        company.workforceEmployees || [],
      );

      const supplierUser = existingCompany.users[0]; // Pega o primeiro SUPPLIER

      if (supplierUser) {
        // UPDATE: Atualiza o usuário SUPPLIER existente
        await prisma.user.update({
          where: { id: supplierUser.id },
          data: {
            name: user.name,
            email: user.email,
            password: hashedPassword,
          },
        });

        // Verifica se o usuário já tem permissões de Documentos
        const hasDocPermissions = await prisma.userModuleAccess.findFirst({
          where: {
            userId: supplierUser.id,
            module: { route: "/documentos" },
          },
        });

        // Se não tem permissões, concede
        if (!hasDocPermissions) {
          await this.grantSupplierPermissions(prisma, supplierUser.id);
        }
      } else {
        // CREATE: Não deveria acontecer, mas cria se não existir
        const newUser = await prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: "SUPPLIER",
            companyId: companyId,
          },
        });

        // Concede permissões de Documentos para novo usuário
        await this.grantSupplierPermissions(prisma, newUser.id);
      }
    });

    return {
      success: true,
      message:
        "Solicitação de acesso enviada com sucesso. Aguardando aprovação do administrador.",
    };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Concede permissões padrão de SUPPLIER (Módulo Documentos + Atividade Anexar)
   */
  private async grantSupplierPermissions(tx: any, userId: string) {
    // 1. Busca o módulo "/documentos"
    const docModule = await tx.module.findFirst({
      where: { route: "/documentos" },
    });

    if (!docModule) {
      console.warn(
        "[COMPANIES] Módulo /documentos não encontrado. Permissões não concedidas.",
      );
      return;
    }

    // 2. Busca a atividade "Anexar documento"
    const attachActivity = await tx.activity.findFirst({
      where: {
        moduleId: docModule.id,
        name: "Anexar documento",
      },
    });

    if (!attachActivity) {
      console.warn('[COMPANIES] Atividade "Anexar documento" não encontrada.');
    }

    // 3. Cria acesso ao Módulo
    const userModuleAccess = await tx.userModuleAccess.create({
      data: {
        userId,
        moduleId: docModule.id,
        isEnabled: true,
      },
    });

    // 4. Se achou a atividade, cria acesso habilitando-a
    if (attachActivity) {
      await tx.userActivityAccess.create({
        data: {
          userModuleAccessId: userModuleAccess.id,
          activityId: attachActivity.id,
          isEnabled: true,
        },
      });
    }
  }

  private async syncCompanyWorkforce(
    tx: any,
    companyId: string,
    allocationRegime: string | undefined,
    workforceEmployees: Array<{
      fullName: string;
      cpf: string;
      position: string;
      hiredAt: string;
    }>,
  ) {
    await tx.companyEmployee.deleteMany({ where: { companyId } });

    if (allocationRegime !== "FULL_WORKFORCE_AT_EADI") {
      return;
    }

    const validEmployees = workforceEmployees
      .map((employee) => ({
        fullName: employee.fullName?.trim(),
        cpf: employee.cpf?.replace(/\D/g, ""),
        position: employee.position?.trim(),
        hiredAt: employee.hiredAt,
      }))
      .filter(
        (employee) =>
          employee.fullName &&
          employee.cpf &&
          employee.position &&
          employee.hiredAt,
      );

    if (validEmployees.length === 0) {
      return;
    }

    await tx.companyEmployee.createMany({
      data: validEmployees.map((employee) => ({
        companyId,
        fullName: employee.fullName,
        cpf: employee.cpf,
        position: employee.position,
        hiredAt: new Date(employee.hiredAt),
      })),
    });
  }

  private async getStatusCounts(search?: string) {
    // Construir where apenas com busca (sem filtro de status)
    const baseWhere = this.buildWhereClause(search, undefined);

    // Adicionar filtro para excluir PENDING
    const whereWithoutPending: Prisma.CompanyWhereInput = {
      ...baseWhere,
      status: {
        not: "PENDING",
      },
    };

    // Buscar contagem agrupada por status
    const counts = await this.prisma.company.groupBy({
      by: ["status"],
      where: whereWithoutPending,
      _count: {
        status: true,
      },
    });

    // Formatar resultado em objeto { ACTIVE: 25, REJECTED: 5, ... }
    const statusCounts = counts.reduce(
      (acc, item) => {
        if (item._count) {
          acc[item.status] = item._count.status;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Garantir que todos os status existam no objeto (exceto PENDING, com valor 0)
    const allStatus = Object.values(CompanyStatus).filter(
      (status) => status !== "PENDING",
    );
    allStatus.forEach((status) => {
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
    });

    return statusCounts;
  }

  private buildWhereClause(
    search?: string,
    status?: string,
    supplierTypeName?: string,
  ): Prisma.CompanyWhereInput {
    const where: Prisma.CompanyWhereInput = {};

    if (supplierTypeName) {
      where.supplierTypes = {
        some: {
          supplierType: {
            name: {
              equals: supplierTypeName,
              mode: "insensitive",
            },
          },
        },
      };
    }

    if (search) {
      const orConditions: any[] = [
        { fantasyName: { contains: search, mode: "insensitive" } },
        { socialReason: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];

      // Só adiciona filtro de CNPJ se houver números no termo de busca
      const cleanedSearch = search.replace(/\D/g, "");
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

  private buildOrderBy(
    sortBy: string,
    sortOrder: "asc" | "desc",
  ): Prisma.CompanyOrderByWithRelationInput {
    const validFields = [
      "createdAt",
      "fantasyName",
      "socialReason",
      "cnpj",
      "city",
      "status",
    ];
    const field = validFields.includes(sortBy) ? sortBy : "createdAt";
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
        classification: company.classification,
        allocationRegime: company.allocationRegime,
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



