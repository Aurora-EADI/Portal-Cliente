import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async findAll(params?: { page?: number; limit?: number; search?: string; roles?: string }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.roles) {
      where.role = { in: params.roles.split(',').map((r) => r.trim()) };
    }
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          position: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          moduleAccess: { select: { moduleId: true, isEnabled: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        position: true, active: true, createdAt: true, updatedAt: true,
        moduleAccess: { include: { module: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email já cadastrado');

    const identity = await this.authService.provisionCredential({
      name: dto.name.trim().toUpperCase(),
      email,
      password: dto.password,
    });

    try {
      return await this.prisma.user.update({
        where: { id: identity.id },
        data: {
          role: dto.role ?? UserRole.EMPLOYEE,
          position: dto.position,
          active: true,
        },
        select: { id: true, name: true, email: true, role: true, position: true, active: true, createdAt: true, updatedAt: true },
      });
    } catch (error) {
      await this.authService.removeCredential(identity.id).catch(() => undefined);
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Usuário não encontrado');

    const data: any = { ...dto };
    if (dto.name) data.name = dto.name.toUpperCase();

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, position: true, active: true, createdAt: true, updatedAt: true },
    });
    return user;
  }

  async remove(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuário removido' };
  }
}
