import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AllocationRegime,
  CompanyClassification,
  Prisma,
} from "@prisma/client";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { UpsertSupplierTypeDto } from "./dto/upsert-supplier-type.dto";
import { UpsertRequirementRuleDto } from "./dto/upsert-requirement-rule.dto";
import {
  UpdateCompanyProfileDto,
  UpdateCompanyWorkforceDto,
} from "./dto/update-company-profile.dto";
import { WorkforceQueryDto } from "./dto/workforce-query.dto";
import { UpdateWorkforceRequirementsDto } from "./dto/update-workforce-requirements.dto";

type WorkforceStatus = "ACTIVE" | "INACTIVE";

@Injectable()
export class RequirementRulesService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  private readonly defaultSupplierTypes = [
    "TRANSPORTADOR",
    "FORNECEDOR DE MATERIAIS",
    "VIGILANCIA",
    "MANUTENCAO",
    "LOCACAO DE EQUIPAMENTOS",
    "PRESTADOR DE SERVICOS",
    "MAO DE OBRA TERCEIRIZADA",
    "LIMPEZA",
    "FORNECEDOR DE REFEICAO",
    "OUTROS",
  ];

  private async ensureDefaultSupplierTypes() {
    const existing = await this.prisma.supplierType.findMany({
      select: { name: true },
    });

    const existingNames = new Set(
      existing.map((item) => item.name.trim().toUpperCase()),
    );

    const missing = this.defaultSupplierTypes.filter(
      (name) => !existingNames.has(name),
    );

    if (missing.length > 0) {
      await this.prisma.supplierType.createMany({
        data: missing.map((name) => ({
          name,
          active: true,
        })),
      });
    }
  }

  async listSupplierTypes() {
    await this.ensureDefaultSupplierTypes();

    return this.prisma.supplierType.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  createSupplierType(dto: UpsertSupplierTypeDto) {
    return this.prisma.supplierType.create({
      data: {
        name: dto.name.trim().toUpperCase(),
        description: dto.description?.trim(),
        active: dto.active ?? true,
      },
    });
  }

  updateSupplierType(id: string, dto: Partial<UpsertSupplierTypeDto>) {
    return this.prisma.supplierType.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim().toUpperCase() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ?? null }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  listRules() {
    return this.prisma.documentRequirementRule.findMany({
      include: {
        supplierType: true,
        items: {
          include: {
            documentType: true,
          },
          orderBy: {
            documentType: {
              name: "asc",
            },
          },
        },
      },
      orderBy: [
        { companyClassification: "asc" },
        { allocationRegime: "asc" },
        { supplierType: { name: "asc" } },
      ],
    });
  }

  async upsertRule(dto: UpsertRequirementRuleDto) {
    const supplierType = await this.prisma.supplierType.findUnique({
      where: { id: dto.supplierTypeId },
      select: { id: true, active: true },
    });

    if (!supplierType || !supplierType.active) {
      throw new NotFoundException("Tipo de fornecedor nÃ£o encontrado");
    }

    const normalizedItemsMap = new Map<
      number,
      { documentTypeId: number; isRequired: boolean }
    >();
    for (const item of dto.items) {
      normalizedItemsMap.set(item.documentTypeId, {
        documentTypeId: item.documentTypeId,
        isRequired: item.isRequired,
      });
    }
    const normalizedItems = Array.from(normalizedItemsMap.values());
    const uniqueDocumentTypeIds = normalizedItems.map((i) => i.documentTypeId);

    const existingDocumentTypes = await this.prisma.documentType.findMany({
      where: {
        id: { in: uniqueDocumentTypeIds },
      },
      select: { id: true },
    });

    if (existingDocumentTypes.length !== uniqueDocumentTypeIds.length) {
      throw new BadRequestException(
        "Um ou mais tipos de documento informados nÃ£o existem",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.documentRequirementRule.upsert({
        where: {
          requirement_rule_unique_combo: {
            companyClassification: dto.companyClassification,
            allocationRegime: dto.allocationRegime,
            supplierTypeId: dto.supplierTypeId,
          },
        },
        create: {
          companyClassification: dto.companyClassification,
          allocationRegime: dto.allocationRegime,
          supplierTypeId: dto.supplierTypeId,
          active: dto.active,
        },
        update: {
          active: dto.active,
        },
      });

      await tx.documentRequirementRuleItem.deleteMany({
        where: { ruleId: rule.id },
      });

      if (normalizedItems.length > 0) {
        await tx.documentRequirementRuleItem.createMany({
          data: normalizedItems.map((item) => ({
            ruleId: rule.id,
            documentTypeId: item.documentTypeId,
            isRequired: item.isRequired,
          })),
        });
      }

      return tx.documentRequirementRule.findUnique({
        where: { id: rule.id },
        include: {
          supplierType: true,
          items: {
            include: { documentType: true },
            orderBy: { documentType: { name: "asc" } },
          },
        },
      });
    });
  }

  async updateCompanyProfile(companyId: string, dto: UpdateCompanyProfileDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID ${companyId} nÃ£o encontrada`);
    }

    const uniqueSupplierTypeIds = [...new Set(dto.supplierTypeIds)];
    const types = await this.prisma.supplierType.findMany({
      where: {
        id: { in: uniqueSupplierTypeIds },
        active: true,
      },
      select: { id: true },
    });

    if (types.length !== uniqueSupplierTypeIds.length) {
      throw new BadRequestException(
        "Um ou mais tipos de fornecedor informados nÃ£o existem ou estÃ£o inativos",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: {
          classification: dto.classification,
          allocationRegime: dto.allocationRegime,
        },
      });

      await tx.companySupplierType.deleteMany({
        where: { companyId },
      });

      await tx.companySupplierType.createMany({
        data: uniqueSupplierTypeIds.map((supplierTypeId) => ({
          companyId,
          supplierTypeId,
        })),
      });

      return updatedCompany;
    });
  }

  async updateCompanyWorkforce(
    companyId: string,
    dto: UpdateCompanyWorkforceDto,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        allocationRegime: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID ${companyId} nÃ£o encontrada`);
    }

    if (
      company.allocationRegime === AllocationRegime.FULL_WORKFORCE_AT_EADI &&
      dto.employees.length === 0
    ) {
      throw new BadRequestException(
        "Empresas com regime FULL devem informar ao menos um funcionÃ¡rio",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.companyEmployee.deleteMany({
        where: { companyId },
      });

      if (dto.employees.length > 0) {
        const uniqueCpfs = new Set<string>();
        for (const employee of dto.employees) {
          const normalizedCpf = employee.cpf.replace(/\D/g, "");
          if (normalizedCpf.length !== 11) {
            throw new BadRequestException(
              `CPF invÃ¡lido para funcionÃ¡rio ${employee.fullName}`,
            );
          }
          if (uniqueCpfs.has(normalizedCpf)) {
            throw new BadRequestException(
              `CPF duplicado na lista de funcionÃ¡rios: ${employee.cpf}`,
            );
          }
          uniqueCpfs.add(normalizedCpf);
        }

        await tx.companyEmployee.createMany({
          data: dto.employees.map((employee) => {
            const hiredAt = new Date(employee.hiredAt);
            if (Number.isNaN(hiredAt.getTime())) {
              throw new BadRequestException(
                `Data de admissao invalida para funcionario ${employee.fullName}`,
              );
            }

            return {
              companyId,
              fullName: employee.fullName.trim(),
              cpf: employee.cpf.replace(/\D/g, ""),
              position: employee.position.trim(),
              hiredAt,
              status: employee.status ?? "ACTIVE",
            };
          }),
        } as any);
      }

      return tx.companyEmployee.findMany({
        where: { companyId },
        orderBy: [{ fullName: "asc" }],
      });
    });
  }

  getCompanyWorkforce(companyId: string) {
    return this.prisma.companyEmployee.findMany({
      where: { companyId },
      orderBy: [{ fullName: "asc" }],
    });
  }

  async listWorkforce(query: WorkforceQueryDto, scopeCompanyId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      companyId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;
    const cleanSearch = search?.replace(/\D/g, "");

    const where: Prisma.CompanyEmployeeWhereInput = {
      ...(status ? { status } : {}),
      ...(scopeCompanyId ? { companyId: scopeCompanyId } : companyId ? { companyId } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { position: { contains: search, mode: "insensitive" } },
              {
                company: {
                  OR: [
                    { fantasyName: { contains: search, mode: "insensitive" } },
                    { socialReason: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
              ...(cleanSearch
                ? [{ cpf: { contains: cleanSearch } as Prisma.StringFilter }]
                : []),
            ],
          }
        : {}),
    };

    const orderBy = this.buildWorkforceOrderBy(sortBy, sortOrder);

    const [employees, total] = await Promise.all([
      this.prisma.companyEmployee.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              fantasyName: true,
              socialReason: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      } as any),
      this.prisma.companyEmployee.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: (employees as any[]).map((employee) => ({
        id: employee.id,
        fullName: employee.fullName,
        cpf: employee.cpf,
        position: employee.position,
        hiredAt: employee.hiredAt,
        status: employee.status,
        company: employee.company,
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

  async getWorkforceById(id: string, scopeCompanyId?: string) {
    const employee = await this.prisma.companyEmployee.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            fantasyName: true,
            socialReason: true,
            cnpj: true,
            phone: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException("Terceiro nao encontrado");
    }
    if (scopeCompanyId && employee.companyId !== scopeCompanyId) {
      throw new ForbiddenException("Acesso negado a terceiro de outra empresa");
    }

    return employee;
  }

  async updateWorkforceStatus(
    id: string,
    status: WorkforceStatus,
    scopeCompanyId?: string,
  ) {
    try {
      if (scopeCompanyId) {
        const existing = await this.prisma.companyEmployee.findUnique({
          where: { id },
          select: { companyId: true },
        });
        if (!existing) {
          throw new NotFoundException("Terceiro nao encontrado");
        }
        if (existing.companyId !== scopeCompanyId) {
          throw new ForbiddenException("Acesso negado a terceiro de outra empresa");
        }
      }

      return await this.prisma.companyEmployee.update({
        where: { id },
        data: { status } as any,
        include: {
          company: {
            select: {
              id: true,
              fantasyName: true,
              socialReason: true,
            },
          },
        },
      } as any);
    } catch (error: any) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException("Terceiro nao encontrado");
    }
  }

  async getWorkforceRequirements(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID ${companyId} nao encontrada`);
    }

    return this.prisma.workforceDocumentRequirement.findMany({
      where: {
        companyId,
        active: true,
      },
      include: {
        documentType: true,
      },
      orderBy: {
        documentType: { name: "asc" },
      },
    });
  }

  async updateWorkforceRequirements(
    companyId: string,
    dto: UpdateWorkforceRequirementsDto,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID ${companyId} nao encontrada`);
    }

    const uniqueItemsMap = new Map<number, { documentTypeId: number; isRequired: boolean }>();
    for (const item of dto.requirements) {
      uniqueItemsMap.set(item.documentTypeId, {
        documentTypeId: item.documentTypeId,
        isRequired: item.isRequired,
      });
    }
    const uniqueItems = Array.from(uniqueItemsMap.values());

    const documentTypeIds = uniqueItems.map((item) => item.documentTypeId);
    const existingDocumentTypes = await this.prisma.documentType.findMany({
      where: { id: { in: documentTypeIds } },
      select: { id: true },
    });

    if (existingDocumentTypes.length !== documentTypeIds.length) {
      throw new BadRequestException(
        "Um ou mais tipos de documento informados nao existem",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of uniqueItems) {
        await tx.workforceDocumentRequirement.upsert({
          where: {
            companyId_documentTypeId: {
              companyId,
              documentTypeId: item.documentTypeId,
            },
          },
          update: {
            isRequired: item.isRequired,
            active: true,
          },
          create: {
            companyId,
            documentTypeId: item.documentTypeId,
            isRequired: item.isRequired,
            active: true,
          },
        });
      }

      const incomingIds = uniqueItems.map((item) => item.documentTypeId);
      await tx.workforceDocumentRequirement.updateMany({
        where: incomingIds.length
          ? {
              companyId,
              documentTypeId: { notIn: incomingIds },
            }
          : {
              companyId,
            },
        data: {
          active: false,
          isRequired: false,
        },
      });
    });

    return this.getWorkforceRequirements(companyId);
  }

  async getGlobalWorkforceRequirements() {
    return this.prisma.globalWorkforceDocumentRequirement.findMany({
      where: {
        active: true,
        isRequired: true,
      },
      include: {
        documentType: true,
      },
      orderBy: {
        documentType: { name: "asc" },
      },
    });
  }

  async updateGlobalWorkforceRequirements(dto: UpdateWorkforceRequirementsDto) {
    const uniqueItemsMap = new Map<number, { documentTypeId: number; isRequired: boolean }>();
    for (const item of dto.requirements) {
      uniqueItemsMap.set(item.documentTypeId, {
        documentTypeId: item.documentTypeId,
        isRequired: item.isRequired,
      });
    }
    const uniqueItems = Array.from(uniqueItemsMap.values());

    const documentTypeIds = uniqueItems.map((item) => item.documentTypeId);
    const existingDocumentTypes = await this.prisma.documentType.findMany({
      where: { id: { in: documentTypeIds } },
      select: { id: true },
    });

    if (existingDocumentTypes.length !== documentTypeIds.length) {
      throw new BadRequestException(
        "Um ou mais tipos de documento informados nao existem",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of uniqueItems) {
        await tx.globalWorkforceDocumentRequirement.upsert({
          where: {
            documentTypeId: item.documentTypeId,
          },
          update: {
            isRequired: item.isRequired,
            active: true,
          },
          create: {
            documentTypeId: item.documentTypeId,
            isRequired: item.isRequired,
            active: true,
          },
        });
      }

      const incomingIds = uniqueItems.map((item) => item.documentTypeId);
      await tx.globalWorkforceDocumentRequirement.updateMany({
        where: incomingIds.length
          ? {
              documentTypeId: { notIn: incomingIds },
            }
          : {},
        data: {
          active: false,
          isRequired: false,
        },
      });
    });

    return this.getGlobalWorkforceRequirements();
  }

  private buildWorkforceOrderBy(
    sortBy: string,
    sortOrder: "asc" | "desc",
  ): Prisma.CompanyEmployeeOrderByWithRelationInput {
    const validFields = ["createdAt", "fullName", "position", "hiredAt", "status"];
    const field = validFields.includes(sortBy) ? sortBy : "createdAt";
    return { [field]: sortOrder };
  }

  private parseDocumentApplicability(description?: string | null) {
    const tokens = (description || "")
      .split("|")
      .map((token) => token.trim())
      .filter(Boolean);

    let allowedClassifications: CompanyClassification[] = [];
    let isSpecificDocument = false;
    let allowedSupplierTypeIds: string[] = [];
    let allowedSupplierTypeNames: string[] = [];

    for (const token of tokens) {
      const normalizedToken = this.normalizeTextLoose(token);
      const value = token.includes(":")
        ? token.split(":").slice(1).join(":").trim()
        : "";

      if (
        normalizedToken.includes("classific") &&
        normalizedToken.includes("empresarial")
      ) {
        const normalized = value
          .split(",")
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean);
        allowedClassifications = normalized.filter((item) =>
          ["MEI", "ME", "EPP", "EIRELI"].includes(item),
        ) as CompanyClassification[];
        continue;
      }

      if (
        normalizedToken.includes("documento") &&
        normalizedToken.includes("especific")
      ) {
        const normalizedValue = this.normalizeTextLoose(value);
        isSpecificDocument = normalizedValue === "sim";
        continue;
      }

      if (
        normalizedToken.includes("tipos de fornecedor") &&
        normalizedToken.includes("id")
      ) {
        allowedSupplierTypeIds = value
          ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [];
        continue;
      }

      if (normalizedToken.includes("tipos de fornecedor")) {
        allowedSupplierTypeNames = value
          ? value
              .split(",")
              .map((item) => this.normalizeTextLoose(item))
              .filter(Boolean)
          : [];
      }
    }

    return {
      allowedClassifications,
      isSpecificDocument,
      allowedSupplierTypeIds,
      allowedSupplierTypeNames,
    };
  }

  private isDocumentApplicableToCompany(
    description: string | null | undefined,
    companyClassification: CompanyClassification,
    companySupplierTypeIds: string[],
    companySupplierTypeNames: string[],
  ) {
    const parsed = this.parseDocumentApplicability(description);
    const normalizedCompanySupplierTypeNames = companySupplierTypeNames.map((name) =>
      this.normalizeTextLoose(name),
    );

    if (
      parsed.allowedClassifications.length > 0 &&
      !parsed.allowedClassifications.includes(companyClassification)
    ) {
      return false;
    }

    if (!parsed.isSpecificDocument) {
      return true;
    }

    if (parsed.allowedSupplierTypeIds.length > 0) {
      return parsed.allowedSupplierTypeIds.some((id) =>
        companySupplierTypeIds.includes(id),
      );
    }

    if (parsed.allowedSupplierTypeNames.length > 0) {
      return parsed.allowedSupplierTypeNames.some((name) =>
        normalizedCompanySupplierTypeNames.includes(name),
      );
    }

    return false;
  }

  private normalizeTextLoose(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s:,-]/g, "")
      .toLowerCase()
      .trim();
  }

  private isCompanyScopeDocument(description?: string | null) {
    const normalized = (description || "").toLowerCase();
    if (normalized.includes("escopo: colaborador")) {
      return false;
    }
    return true;
  }

  async getEffectiveRequirementsByUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      throw new NotFoundException("Empresa nÃ£o encontrada para este usuÃ¡rio");
    }

    return this.getEffectiveRequirementsByCompany(user.companyId);
  }

  async getEffectiveRequirementsByCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        supplierTypes: {
          include: {
            supplierType: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID ${companyId} nÃ£o encontrada`);
    }

    const supplierTypeIds = company.supplierTypes.map(
      (cst) => cst.supplierTypeId,
    );
    const supplierTypeNames = company.supplierTypes.map((cst) =>
      cst.supplierType?.name?.trim().toUpperCase(),
    ).filter((name): name is string => Boolean(name));

    const [rules, overrides] = await Promise.all([
      supplierTypeIds.length
        ? this.prisma.documentRequirementRule.findMany({
            where: {
              active: true,
              companyClassification: company.classification,
              allocationRegime: company.allocationRegime,
              supplierTypeId: { in: supplierTypeIds },
            },
            include: {
              items: {
                include: {
                  documentType: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      this.prisma.companyDocumentRequirement.findMany({
        where: { companyId },
        include: {
          documentType: true,
        },
      }),
    ]);

    const resolvedMap = new Map<
      number,
      {
        documentTypeId: number;
        isRequired: boolean;
        source: "RULE" | "OVERRIDE";
        documentType: any;
      }
    >();

    for (const rule of rules) {
      for (const item of rule.items) {
        const existing = resolvedMap.get(item.documentTypeId);
        resolvedMap.set(item.documentTypeId, {
          documentTypeId: item.documentTypeId,
          isRequired: existing
            ? existing.isRequired || item.isRequired
            : item.isRequired,
          source: "RULE",
          documentType: item.documentType,
        });
      }
    }

    for (const override of overrides) {
      resolvedMap.set(override.documentTypeId, {
        documentTypeId: override.documentTypeId,
        isRequired: override.isRequired,
        source: "OVERRIDE",
        documentType: override.documentType,
      });
    }

    const fallbackDocumentTypes = await this.prisma.documentType.findMany({
      where: { active: true },
    });

    for (const documentType of fallbackDocumentTypes) {
      if (!this.isCompanyScopeDocument(documentType.description)) {
        continue;
      }

      if (
        !this.isDocumentApplicableToCompany(
          documentType.description,
          company.classification,
          supplierTypeIds,
          supplierTypeNames,
        )
      ) {
        continue;
      }

      if (!resolvedMap.has(documentType.id)) {
        resolvedMap.set(documentType.id, {
          documentTypeId: documentType.id,
          isRequired: true,
          source: "RULE",
          documentType,
        });
      }
    }

    return Array.from(resolvedMap.values())
      .filter((item) =>
        this.isDocumentApplicableToCompany(
          item.documentType?.description,
          company.classification,
          supplierTypeIds,
          supplierTypeNames,
        ),
      )
      .sort((a, b) =>
        a.documentType.name.localeCompare(b.documentType.name, "pt-BR"),
      );
  }
}

