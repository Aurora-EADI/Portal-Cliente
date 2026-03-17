import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import * as bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { RequirementRulesService } from "../requirement-rules/requirement-rules.service";

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requirementRulesService: RequirementRulesService,
  ) {}

  async create(dto: CreateSupplierDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new NotFoundException("Empresa nÃ£o encontrada.");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: UserRole.SUPPLIER,
        companyId: dto.companyId,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: UserRole.SUPPLIER },
      include: { company: true },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.user.findFirst({
      where: { id, role: UserRole.SUPPLIER },
      include: { company: true },
    });

    if (!supplier) {
      throw new NotFoundException("Supplier nÃ£o encontrado.");
    }

    return supplier;
  }

  async update(id: string, dto: Partial<CreateSupplierDto>) {
    const supplier = await this.prisma.user.findFirst({
      where: { id, role: UserRole.SUPPLIER },
    });

    if (!supplier) {
      throw new NotFoundException("Supplier nÃ£o encontrado.");
    }

    const data: any = { ...dto };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const supplier = await this.prisma.user.findFirst({
      where: { id, role: UserRole.SUPPLIER },
    });

    if (!supplier) {
      throw new NotFoundException("Supplier nÃ£o encontrado.");
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getRequirements(userId: string) {
    return this.requirementRulesService.getEffectiveRequirementsByUser(userId);
  }
}


