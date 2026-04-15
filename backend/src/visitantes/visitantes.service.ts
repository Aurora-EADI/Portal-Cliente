import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaPostgresService as PrismaService } from '../prisma/prisma.service';
import { UpdateVisitanteStatusDto } from './dto/update-visitante-status.dto';
import { VisitanteStatus } from '@prisma/client';

@Injectable()
export class VisitantesService {
  private readonly logger = new Logger(VisitantesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    nome?: string;
    status?: VisitanteStatus;
    data?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  }) {
    this.logger.log('Listando visitantes com filtros');

    const where: any = {};

    if (filters?.nome) {
      where.nome = { contains: filters.nome, mode: 'insensitive' };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dataInicio || filters?.dataFim) {
      const range: { gte?: string; lte?: string } = {};
      if (filters.dataInicio) {
        range.gte = `${filters.dataInicio}T00:00:00.000Z`;
      }
      if (filters.dataFim) {
        range.lte = `${filters.dataFim}T23:59:59.999Z`;
      }
      where.horarioPrevisto = range;
    } else if (filters?.data) {
      where.horarioPrevisto = {
        gte: `${filters.data}T00:00:00.000Z`,
        lte: `${filters.data}T23:59:59.999Z`,
      };
    }

    const page = filters?.page ? Number(filters.page) : 1;
    const limit = filters?.limit ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.preRegistroVisitante.findMany({
        where,
        skip,
        take: limit,
        orderBy: { horarioPrevisto: 'asc' },
      }),
      this.prisma.preRegistroVisitante.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    this.logger.log(`Buscando visitante ID: ${id}`);
    const visitante = await this.prisma.preRegistroVisitante.findUnique({
      where: { id },
    });

    if (!visitante) {
      throw new NotFoundException(`Visitante com ID ${id} não encontrado`);
    }

    return visitante;
  }

  async updateStatus(id: string, dto: UpdateVisitanteStatusDto) {
    const visitante = await this.findOne(id);

    if (visitante.status !== VisitanteStatus.AGENDADO) {
      throw new BadRequestException(
        'Somente visitantes com status AGENDADO podem ter o status atualizado.',
      );
    }

    this.logger.log(`Atualizando status do visitante ${id} para ${dto.status}`);

    return this.prisma.preRegistroVisitante.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
