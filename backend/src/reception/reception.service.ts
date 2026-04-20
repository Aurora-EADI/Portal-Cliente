import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Injectable()
export class ReceptionService {
  private readonly logger = new Logger(ReceptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactDto) {
    this.logger.log(`Criando contato de recepção: ${dto.name}`);
    return this.prisma.receptionContact.create({
      data: dto,
    });
  }

  async findAll(filters?: {
    name?: string;
    department?: string;
    position?: string;
    page?: number;
    limit?: number;
  }) {
    this.logger.log("Listando contatos de recepção com filtros e paginação");
    const where: any = { active: true };

    if (filters?.name) {
      where.name = { contains: filters.name, mode: "insensitive" };
    }
    if (filters?.department) {
      where.department = { contains: filters.department, mode: "insensitive" };
    }
    if (filters?.position) {
      where.position = { contains: filters.position, mode: "insensitive" };
    }

    const page = filters?.page ? Number(filters.page) : 1;
    const limit = filters?.limit ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.receptionContact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.receptionContact.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    this.logger.log(`Buscando contato de recepção com ID: ${id}`);
    const contact = await this.prisma.receptionContact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException(`Contato com ID ${id} não encontrado`);
    }

    return contact;
  }

  async update(id: string, dto: UpdateContactDto) {
    this.logger.log(`Atualizando contato de recepção ${id}`);
    await this.findOne(id);

    return this.prisma.receptionContact.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    this.logger.log(`Removendo contato de recepção ${id}`);
    await this.findOne(id);

    return this.prisma.receptionContact.update({
      where: { id },
      data: { active: false },
    });
  }
}
