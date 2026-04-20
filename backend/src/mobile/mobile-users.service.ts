import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { CreateMobileUserDto } from "./dto/create-mobile-user.dto";
import { UpdateMobileUserDto } from "./dto/update-mobile-user.dto";

@Injectable()
export class MobileUsersService {
  constructor(private prisma: PrismaService) {}

  private generateInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" as const } },
            {
              email: { contains: params.search, mode: "insensitive" as const },
            },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.userMobile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarInitials: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.userMobile.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.userMobile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarInitials: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException("Usuário mobile não encontrado");
    return user;
  }

  async create(dto: CreateMobileUserDto) {
    const existing = await this.prisma.userMobile.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) throw new ConflictException("E-mail já cadastrado");

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const avatarInitials = this.generateInitials(dto.name);

    return this.prisma.userMobile.create({
      data: {
        name: dto.name.toUpperCase(),
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        role: dto.role,
        avatarInitials,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarInitials: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateMobileUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.userMobile.findFirst({
        where: { email: dto.email.toLowerCase().trim(), NOT: { id } },
      });
      if (existing) throw new ConflictException("E-mail já cadastrado");
    }

    const data: Record<string, unknown> = {};

    if (dto.name) {
      data.name = dto.name.toUpperCase();
      data.avatarInitials = this.generateInitials(dto.name);
    }
    if (dto.email) data.email = dto.email.toLowerCase().trim();
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    if (dto.role) data.role = dto.role;

    return this.prisma.userMobile.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarInitials: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.userMobile.delete({ where: { id } });
    return { message: "Usuário mobile removido com sucesso" };
  }
}
