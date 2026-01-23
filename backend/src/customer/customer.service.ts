import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaPostgresService as PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerStatus } from '@prisma/client-postgres';

interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
}

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    // Verificar se já existe cliente com o mesmo código
    const existingByCode = await this.prisma.customer.findUnique({
      where: { code: dto.code },
    });

    if (existingByCode) {
      throw new ConflictException('Já existe um cliente com este código.');
    }

    // Verificar se já existe cliente com o mesmo documento
    const existingByDocument = await this.prisma.customer.findUnique({
      where: { document: dto.document },
    });

    if (existingByDocument) {
      throw new ConflictException('Já existe um cliente com este documento.');
    }

    return this.prisma.customer.create({
      data: {
        code: dto.code,
        name: dto.name,
        document: dto.document,
      },
    });
  }

  async findAll(params?: FindAllParams) {
    const { page = 1, limit = 10, search, status } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [customers, total, statusCounts] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
      this.getStatusCounts(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: customers,
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

  private async getStatusCounts() {
    const counts = await this.prisma.customer.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return counts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    // Verificar unicidade do código se estiver sendo alterado
    if (dto.code && dto.code !== customer.code) {
      const existingByCode = await this.prisma.customer.findUnique({
        where: { code: dto.code },
      });

      if (existingByCode) {
        throw new ConflictException('Já existe um cliente com este código.');
      }
    }

    // Verificar unicidade do documento se estiver sendo alterado
    if (dto.document && dto.document !== customer.document) {
      const existingByDocument = await this.prisma.customer.findUnique({
        where: { document: dto.document },
      });

      if (existingByDocument) {
        throw new ConflictException('Já existe um cliente com este documento.');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(id: string, status: CustomerStatus) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.customer.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
