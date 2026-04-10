import { Injectable } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { CreateInspectionDto } from "./dto/create-inspection.dto";
import { CompleteInspectionDto } from "./dto/complete-inspection.dto";

@Injectable()
export class MobileInspectionsService {
  constructor(private prisma: PrismaService) {}

  async listInspections(userId: string) {
    return this.prisma.inspectionMobile.findMany({
      where: { userId },
      include: {
        lados: { include: { itens: true } },
        fotos: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createInspection(userId: string, dto: CreateInspectionDto) {
    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.inspectionMobile.create({
        data: {
          tipoOperacao: dto.tipoOperacao,
          statusContainer: dto.statusContainer,
          containerNumero: dto.containerNumero,
          containerType: dto.containerType,
          destino: dto.destino,
          origem: dto.origem,
          transportadora: dto.transportadora,
          condicaoContainer: dto.condicaoContainer,
          lacre: dto.lacre,
          motorista: dto.motorista,
          cpf: dto.cpf,
          placaCavalo: dto.placaCavalo,
          placaPrancha: dto.placaPrancha,
          dataHora: new Date(dto.dataHora),
          localizacaoArmazenagem: dto.localizacaoArmazenagem,
          observacaoGeral: dto.observacaoGeral,
          gpsLat: dto.gpsLat,
          gpsLng: dto.gpsLng,
          inspectionStatus: "in_progress",
          userId,
        },
      });

      if (dto.lados && dto.lados.length > 0) {
        for (const ladoDto of dto.lados) {
          const side = await tx.sideInspectionMobile.create({
            data: {
              lado: ladoDto.lado,
              inspecionado: ladoDto.inspecionado ?? false,
              inspectionId: inspection.id,
            },
          });

          if (ladoDto.itens && ladoDto.itens.length > 0) {
            for (const itemDto of ladoDto.itens) {
              await tx.inspectionItemMobile.create({
                data: {
                  nome: itemDto.nome,
                  posicao: itemDto.posicao,
                  status: itemDto.status,
                  avarias: itemDto.avarias ?? [],
                  observacao: itemDto.observacao,
                  sideId: side.id,
                },
              });
            }
          }
        }
      }

      return tx.inspectionMobile.findUnique({
        where: { id: inspection.id },
        include: { lados: { include: { itens: true } }, fotos: true },
      });
    });
  }

  async getInspection(id: string, userId: string) {
    return this.prisma.inspectionMobile.findFirst({
      where: { id, userId },
      include: { lados: { include: { itens: true } }, fotos: true },
    });
  }

  async listAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.status) where.inspectionStatus = params.status;
    if (params.userId) where.userId = params.userId;

    if (params.startDate || params.endDate) {
      where.dataHora = {
        ...(params.startDate && { gte: new Date(params.startDate) }),
        ...(params.endDate && { lte: new Date(params.endDate) }),
      };
    }

    if (params.search) {
      where.OR = [
        { containerNumero: { contains: params.search, mode: "insensitive" } },
        { motorista: { contains: params.search, mode: "insensitive" } },
        { placaCavalo: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inspectionMobile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataHora: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          fotos: { select: { id: true, url: true, fileName: true } },
        },
      }),
      this.prisma.inspectionMobile.count({ where }),
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

  async getOneForPortal(id: string) {
    return this.prisma.inspectionMobile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        lados: {
          include: {
            itens: {
              include: {
                fotos: { select: { id: true, url: true, fileName: true } },
              },
            },
          },
        },
        fotos: {
          select: { id: true, url: true, fileName: true, itemId: true },
        },
      },
    });
  }

  async updateInspection(
    id: string,
    userId: string,
    dto: CompleteInspectionDto,
  ) {
    const existing = await this.prisma.inspectionMobile.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inspectionMobile.update({
        where: { id },
        data: {
          ...(dto.inspectionStatus && {
            inspectionStatus: dto.inspectionStatus,
          }),
          ...(dto.assinatura !== undefined && { assinatura: dto.assinatura }),
          ...(dto.gpsLat !== undefined && { gpsLat: dto.gpsLat }),
          ...(dto.gpsLng !== undefined && { gpsLng: dto.gpsLng }),
          ...(dto.observacaoGeral !== undefined && {
            observacaoGeral: dto.observacaoGeral,
          }),
        },
      });

      if (dto.lados && dto.lados.length > 0) {
        const sides = await tx.sideInspectionMobile.findMany({
          where: { inspectionId: id },
          include: { itens: true },
        });

        for (const ladoDto of dto.lados) {
          const side = sides.find((s) => s.lado === ladoDto.lado);
          if (!side) continue;

          if (ladoDto.inspecionado !== undefined) {
            await tx.sideInspectionMobile.update({
              where: { id: side.id },
              data: { inspecionado: ladoDto.inspecionado },
            });
          }

          if (ladoDto.itens && ladoDto.itens.length > 0) {
            for (
              let i = 0;
              i < ladoDto.itens.length && i < side.itens.length;
              i++
            ) {
              const itemDto = ladoDto.itens[i];
              await tx.inspectionItemMobile.update({
                where: { id: side.itens[i].id },
                data: {
                  ...(itemDto.status !== undefined && {
                    status: itemDto.status,
                  }),
                  ...(itemDto.avarias !== undefined && {
                    avarias: itemDto.avarias,
                  }),
                  ...(itemDto.observacao !== undefined && {
                    observacao: itemDto.observacao,
                  }),
                },
              });
            }
          }
        }
      }

      return updated;
    });
  }
}
