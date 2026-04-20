import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaPostgresService as PrismaService } from '../prisma/prisma.service';
import { UpdateVisitanteStatusDto } from './dto/update-visitante-status.dto';
import { VisitanteStatus } from '@prisma/client';
import { VisitantesSummary } from './type/visitantes-summary.type';

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
      const range: { gte?: Date; lte?: Date } = {};
      if (filters.dataInicio) range.gte = new Date(`${filters.dataInicio}T00:00:00`);
      if (filters.dataFim) range.lte = new Date(`${filters.dataFim}T23:59:59`);
      where.horarioPrevisto = range;
    } else if (filters?.data) {
      where.horarioPrevisto = {
        gte: new Date(`${filters.data}T00:00:00`),
        lte: new Date(`${filters.data}T23:59:59`),
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

  async findSummary(filters?: {
    dataInicio?: string;
    dataFim?: string;
  }): Promise<VisitantesSummary> {
    this.logger.log('Calculando resumo de visitantes por status');

    const where: any = {};

    if (filters?.dataInicio || filters?.dataFim) {
      const range: { gte?: Date; lte?: Date } = {};
      if (filters.dataInicio) range.gte = new Date(`${filters.dataInicio}T00:00:00`);
      if (filters.dataFim) range.lte = new Date(`${filters.dataFim}T23:59:59`);
      where.horarioPrevisto = range;
    }

    const counts = await this.prisma.preRegistroVisitante.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const map = Object.fromEntries(
      counts.map((c) => [c.status, c._count.status]),
    );

    return {
      agendado: map[VisitanteStatus.AGENDADO] ?? 0,
      presente: map[VisitanteStatus.PRESENTE] ?? 0,
      naoCompareceu: map[VisitanteStatus.NAO_COMPARECEU] ?? 0,
    };
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
