import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVeiculosDto } from './dto/create-veiculos.dto';
import { UpdateVeiculosDto } from './dto/update-veiculos.dto';

type UsuarioCadastro = Pick<User, 'role' | 'clienteId' | 'transportadoraContaId'>;

/** Dono do cadastro: cliente e transportadora só enxergam o que é seu. */
function escopo(user: UsuarioCadastro): Prisma.VeiculoWhereInput {
  if (user.role === UserRole.CLIENTE) return { clienteId: user.clienteId ?? '__sem_vinculo__' };
  if (user.role === UserRole.TRANSPORTADORA) {
    return { transportadoraContaId: user.transportadoraContaId ?? '__sem_vinculo__' };
  }
  return {};
}

@Injectable()
export class VeiculosService {
  constructor(private prisma: PrismaService) {}

  findAll(user: UsuarioCadastro, clienteId?: string) {
    return this.prisma.veiculo.findMany({
      where: { ...(clienteId ? { clienteId } : {}), ...escopo(user), ativo: true },
      orderBy: { placa: 'asc' },
    });
  }

  async create(user: UsuarioCadastro, dto: CreateVeiculosDto) {
    const placa = dto.placa.replace(/\s/g, '').toUpperCase();
    try {
      return await this.prisma.veiculo.create({
        data: {
          ...dto,
          placa,
          clienteId: user.role === UserRole.CLIENTE ? user.clienteId : null,
          transportadoraContaId: user.role === UserRole.TRANSPORTADORA ? user.transportadoraContaId : null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Já existe um veículo cadastrado com a placa ${placa}.`);
      }
      throw error;
    }
  }

  async update(user: UsuarioCadastro, id: string, dto: UpdateVeiculosDto) {
    const existente = await this.prisma.veiculo.findFirst({ where: { id, ...escopo(user) } });
    if (!existente) throw new NotFoundException('Veículo não encontrado');
    return this.prisma.veiculo.update({ where: { id }, data: dto });
  }
}
