import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMotoristasDto } from './dto/create-motoristas.dto';
import { UpdateMotoristasDto } from './dto/update-motoristas.dto';

type UsuarioCadastro = Pick<User, 'role' | 'clienteId' | 'transportadoraContaId'>;

/** Dono do cadastro: cliente e transportadora só enxergam o que é seu. */
function escopo(user: UsuarioCadastro): Prisma.MotoristaWhereInput {
  if (user.role === UserRole.CLIENTE) return { clienteId: user.clienteId ?? '__sem_vinculo__' };
  if (user.role === UserRole.TRANSPORTADORA) {
    return { transportadoraContaId: user.transportadoraContaId ?? '__sem_vinculo__' };
  }
  return {};
}

@Injectable()
export class MotoristasService {
  constructor(private prisma: PrismaService) {}

  findAll(user: UsuarioCadastro, clienteId?: string) {
    return this.prisma.motorista.findMany({
      where: { ...(clienteId ? { clienteId } : {}), ...escopo(user), ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async create(user: UsuarioCadastro, dto: CreateMotoristasDto) {
    try {
      return await this.prisma.motorista.create({
        data: {
          ...dto,
          clienteId: user.role === UserRole.CLIENTE ? user.clienteId : null,
          transportadoraContaId: user.role === UserRole.TRANSPORTADORA ? user.transportadoraContaId : null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Já existe um motorista cadastrado com o CPF ${dto.cpf}.`);
      }
      throw error;
    }
  }

  async update(user: UsuarioCadastro, id: string, dto: UpdateMotoristasDto) {
    const existente = await this.prisma.motorista.findFirst({ where: { id, ...escopo(user) } });
    if (!existente) throw new NotFoundException('Motorista não encontrado');
    return this.prisma.motorista.update({ where: { id }, data: dto });
  }
}
