import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaPostgresService } from '../prisma/prisma.service';
import { CreateContainerDto, CreateProcessoDto } from './dto/create-processo.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { UpdateProcessoDto } from './dto/update-processo.dto';

// ─── Helper ───────────────────────────────────────────────────────────────────

function sanitizeBl(value: string): string {
  return value
    .trim()
    .replace(/["',/;]/g, '')
    .replace(/\s+/g, '');
}

function prepareBls(raw: string[], context: string): string[] {
  const sanitized = [...new Set(raw.map(sanitizeBl).filter(Boolean))];
  if (sanitized.length === 0) {
    throw new BadRequestException(
      `${context}: todos os BLs informados são inválidos após sanitização`,
    );
  }
  return sanitized;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DtaMaritimeService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  // ========== PROCESSOS ==========

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { dta: { contains: search, mode: 'insensitive' as const } },
            { empresa: { contains: search, mode: 'insensitive' as const } },
            { porto: { contains: search, mode: 'insensitive' as const } },
            { navio: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.processoImportacao.findMany({
      where,
      include: {
        _count: { select: { containers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const processo = await this.prisma.processoImportacao.findUnique({
      where: { id },
      include: {
        bls: { orderBy: { createdAt: 'asc' } },
        containers: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo de importação não encontrado');
    }

    return processo;
  }

  async create(dto: CreateProcessoDto) {
    const existing = await this.prisma.processoImportacao.findUnique({
      where: { dta: dto.dta },
    });
    if (existing) {
      throw new ConflictException(`DTA "${dto.dta}" já está cadastrada`);
    }

    const numbers = dto.containers.map((c) => c.number.trim().toUpperCase());
    if (new Set(numbers).size !== numbers.length) {
      throw new BadRequestException(
        'Existem números de container duplicados no mesmo processo',
      );
    }

    const bls = prepareBls(dto.bls, 'DTA');

    return this.prisma.processoImportacao.create({
      data: {
        dta: dto.dta,
        empresa: dto.empresa,
        porto: dto.porto,
        navio: dto.navio,
        ataDta: dto.ataDta ? new Date(dto.ataDta) : null,
        ataMao: dto.ataMao ? new Date(dto.ataMao) : null,
        ataEadi: dto.ataEadi ? new Date(dto.ataEadi) : null,
        conclusao: dto.conclusao ? new Date(dto.conclusao) : null,
        transportador: dto.transportador,
        comissaria: dto.comissaria,
        fobTotal: dto.fobTotal,
        freteTotal: dto.freteTotal,
        cifTotal: dto.cifTotal,
        bls: { create: bls.map((numero) => ({ numero })) },
        containers: {
          create: dto.containers.map((c) => ({
            number: c.number.trim().toUpperCase(),
            tipo: c.tipo,
          })),
        },
      },
      include: {
        bls: { orderBy: { createdAt: 'asc' } },
        containers: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateProcessoDto) {
    await this.findById(id);

    if (dto.dta) {
      const conflict = await this.prisma.processoImportacao.findFirst({
        where: { dta: dto.dta, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(`DTA "${dto.dta}" já está cadastrada`);
      }
    }

    const { bls: rawBls, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (rawBls !== undefined) {
        const bls = prepareBls(rawBls, 'DTA');
        await tx.billOfLading.deleteMany({ where: { processoId: id } });
        await tx.billOfLading.createMany({
          data: bls.map((numero) => ({ processoId: id, numero })),
        });
      }

      return tx.processoImportacao.update({
        where: { id },
        data: {
          ...rest,
          ataDta: rest.ataDta !== undefined ? (rest.ataDta ? new Date(rest.ataDta) : null) : undefined,
          ataMao: rest.ataMao !== undefined ? (rest.ataMao ? new Date(rest.ataMao) : null) : undefined,
          ataEadi: rest.ataEadi !== undefined ? (rest.ataEadi ? new Date(rest.ataEadi) : null) : undefined,
          conclusao: rest.conclusao !== undefined ? (rest.conclusao ? new Date(rest.conclusao) : null) : undefined,
        },
        include: {
          bls: { orderBy: { createdAt: 'asc' } },
          containers: { orderBy: { createdAt: 'asc' } },
        },
      });
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.processoImportacao.delete({ where: { id } });
  }

  // ========== CONTAINERS ==========

  async addContainer(processoId: string, dto: CreateContainerDto) {
    await this.findById(processoId);

    const number = dto.number.trim().toUpperCase();

    const existing = await this.prisma.container.findUnique({
      where: { processoId_number: { processoId, number } },
    });
    if (existing) {
      throw new ConflictException(
        `Container "${number}" já está cadastrado nesta DTA`,
      );
    }

    return this.prisma.container.create({
      data: { processoId, number, tipo: dto.tipo },
    });
  }

  async updateContainer(id: string, dto: UpdateContainerDto) {
    const container = await this.prisma.container.findUnique({ where: { id } });
    if (!container) {
      throw new NotFoundException('Container não encontrado');
    }

    const newNumber = dto.number
      ? dto.number.trim().toUpperCase()
      : container.number;

    if (newNumber !== container.number) {
      const conflict = await this.prisma.container.findUnique({
        where: {
          processoId_number: { processoId: container.processoId, number: newNumber },
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Container "${newNumber}" já está cadastrado nesta DTA`,
        );
      }
    }

    return this.prisma.container.update({
      where: { id },
      data: {
        ...(dto.number ? { number: newNumber } : {}),
        ...(dto.tipo ? { tipo: dto.tipo } : {}),
      },
    });
  }

  async deleteContainer(id: string) {
    const container = await this.prisma.container.findUnique({ where: { id } });
    if (!container) {
      throw new NotFoundException('Container não encontrado');
    }
    await this.prisma.container.delete({ where: { id } });
  }

  // ========== BILL OF LADINGS ==========

  async addBl(processoId: string, numero: string) {
    await this.findById(processoId);

    const sanitized = sanitizeBl(numero);
    if (!sanitized) {
      throw new BadRequestException('Número de BL inválido após sanitização');
    }

    const existing = await this.prisma.billOfLading.findUnique({
      where: { processoId_numero: { processoId, numero: sanitized } },
    });
    if (existing) {
      throw new ConflictException(
        `BL "${sanitized}" já está cadastrado nesta DTA`,
      );
    }

    return this.prisma.billOfLading.create({
      data: { processoId, numero: sanitized },
    });
  }

  async deleteBl(id: string) {
    const bl = await this.prisma.billOfLading.findUnique({ where: { id } });
    if (!bl) {
      throw new NotFoundException('BL não encontrado');
    }
    await this.prisma.billOfLading.delete({ where: { id } });
  }
}
