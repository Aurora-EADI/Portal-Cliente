import { Injectable, Logger } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { SqlServerService } from "../prisma/sqlserver.service";
import { CreateInspectionDto } from "./dto/create-inspection.dto";
import { CompleteInspectionDto } from "./dto/complete-inspection.dto";
import { PendingContainerDto } from "./dto/pending-container.dto";

@Injectable()
export class MobileInspectionsService {
  private readonly logger = new Logger(MobileInspectionsService.name);

  constructor(
    private prisma: PrismaService,
    private sqlServer: SqlServerService,
  ) {}

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
    const result = await this.prisma.$transaction(async (tx) => {
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
          beneficiario: dto.beneficiario,
          dataHora: new Date(dto.dataHora),
          localizacaoArmazenagem: dto.localizacaoArmazenagem,
          observacaoGeral: dto.observacaoGeral,
          gpsLat: dto.gpsLat,
          gpsLng: dto.gpsLng,
          inspectionStatus: "in_progress",
          ...(dto.inspecao717 !== undefined && { inspecao717: dto.inspecao717 as object }),
          ...(dto.inspecao717Header !== undefined && { inspecao717Header: dto.inspecao717Header as object }),
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

    await this.updateContainerEntryStatus(dto.containerNumero, 'in_progress');

    return result;
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
          select: { id: true, url: true, fileName: true, itemId: true, sideLabel: true },
        },
      },
    });
  }

  private normalize(s: string): string {
    return s.replace(/[\s-]/g, '').toUpperCase();
  }

  private async syncContainerEntries(
    sqlResults: PendingContainerDto[],
    _filters: { dtInicio?: string; dtFinal?: string },
  ): Promise<void> {
    for (const r of sqlResults) {
      if (!r.containerNumber?.trim()) continue;

      await this.prisma.containerEntry.upsert({
        where: {
          entryNumber_containerNumber: {
            entryNumber: r.entryNumber,
            containerNumber: r.containerNumber.trim(),
          },
        },
        create: {
          entryNumber: r.entryNumber,
          entryDate: new Date(r.entryDate),
          exitDate: r.exitDate ? new Date(r.exitDate) : null,
          status: r.status,
          tipoEntrada: r.tipoEntrada,
          carrier: r.carrier,
          abreviatura: r.abreviatura ?? null,
          licensePlate: r.licensePlate ?? null,
          licensePlateBoogie: r.licensePlateBoogie ?? null,
          containerNumber: r.containerNumber.trim(),
          lacre: r.lacre ?? null,
          beneficiario: r.beneficiario ?? null,
          motorista: r.motorista ?? null,
          cpfMotorista: r.cpfMotorista ?? null,
          tempoPermanencia: r.tempoPermanencia,
          priority: r.priority,
        },
        update: {
          exitDate: r.exitDate ? new Date(r.exitDate) : null,
          tempoPermanencia: r.tempoPermanencia,
          priority: r.priority,
          lacre: r.lacre ?? null,
        },
      });
    }

    // Reconcile containerStatus with active inspections so entries created
    // by sync after an inspection already existed get the correct status.
    const activeInspections = await this.prisma.inspectionMobile.findMany({
      where: { inspectionStatus: { in: ['in_progress', 'completed'] } },
      select: { containerNumero: true, inspectionStatus: true },
    });

    if (activeInspections.length > 0) {
      const statusMap = new Map<string, string>();
      for (const insp of activeInspections) {
        const norm = this.normalize(insp.containerNumero);
        if (!statusMap.has(norm) || insp.inspectionStatus === 'completed') {
          statusMap.set(norm, insp.inspectionStatus);
        }
      }

      const allEntries = await this.prisma.containerEntry.findMany({
        select: { id: true, containerNumber: true, containerStatus: true },
      });

      for (const entry of allEntries) {
        const norm = this.normalize(entry.containerNumber);
        const expectedStatus = statusMap.get(norm);
        if (expectedStatus && entry.containerStatus !== expectedStatus) {
          await this.prisma.containerEntry.update({
            where: { id: entry.id },
            data: { containerStatus: expectedStatus },
          });
        }
      }
    }
  }

  private async updateContainerEntryStatus(
    containerNumero: string,
    newStatus: string,
  ): Promise<void> {
    try {
      const norm = this.normalize(containerNumero);
      const entries = await this.prisma.containerEntry.findMany({
        select: { id: true, containerNumber: true },
      });
      const matched = entries.find(
        (e) => this.normalize(e.containerNumber) === norm,
      );
      if (matched) {
        await this.prisma.containerEntry.update({
          where: { id: matched.id },
          data: { containerStatus: newStatus },
        });
      }
    } catch (err) {
      this.logger.warn(
        `updateContainerEntryStatus: failed for "${containerNumero}": ${err}`,
      );
    }
  }

  async listContainerEntries(params: {
    page?: number;
    limit?: number;
    search?: string;
    containerStatus?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.containerStatus) where['containerStatus'] = params.containerStatus;

    if (params.startDate || params.endDate) {
      where['entryDate'] = {
        ...(params.startDate && { gte: new Date(params.startDate) }),
        ...(params.endDate && { lte: new Date(params.endDate) }),
      };
    }

    if (params.search) {
      where['OR'] = [
        { containerNumber: { contains: params.search, mode: 'insensitive' } },
        { motorista: { contains: params.search, mode: 'insensitive' } },
        { licensePlate: { contains: params.search, mode: 'insensitive' } },
        { beneficiario: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.containerEntry.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: { entryDate: 'desc' },
      }),
      this.prisma.containerEntry.count({ where: where as any }),
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

  async getPendingContainersFromCache(filters: {
    dtInicio?: string;
    dtFinal?: string;
  }): Promise<PendingContainerDto[]> {
    const where: Record<string, unknown> = {
      containerStatus: { not: 'completed' },
    };

    if (filters.dtInicio || filters.dtFinal) {
      where['entryDate'] = {
        ...(filters.dtInicio && { gte: new Date(filters.dtInicio) }),
        ...(filters.dtFinal && { lte: new Date(filters.dtFinal) }),
      };
    }

    const entries = await this.prisma.containerEntry.findMany({
      where: where as any,
      orderBy: { entryDate: 'desc' },
    });

    return entries.map((e) => ({
      entryNumber: e.entryNumber,
      entryDate: e.entryDate,
      exitDate: e.exitDate ?? undefined,
      status: e.status,
      tipoEntrada: e.tipoEntrada,
      carrier: e.carrier,
      abreviatura: e.abreviatura ?? undefined,
      licensePlate: e.licensePlate ?? undefined,
      licensePlateBoogie: e.licensePlateBoogie ?? undefined,
      containerNumber: e.containerNumber,
      lacre: e.lacre ?? undefined,
      beneficiario: e.beneficiario ?? undefined,
      motorista: e.motorista ?? undefined,
      cpfMotorista: e.cpfMotorista ?? undefined,
      tempoPermanencia: e.tempoPermanencia,
      priority: e.priority as 'low' | 'medium' | 'high',
    }));
  }

  async getPendingContainers(filters: {
    dtInicio?: string;
    dtFinal?: string;
    codTransp?: number;
  }): Promise<PendingContainerDto[]> {
    const safeDateParam = (val?: string): string => {
      if (!val) return "NULL";
      const d = new Date(val);
      if (isNaN(d.getTime())) return "NULL";
      const iso = d.toISOString().replace("T", " ").split(".")[0];
      return `'${iso}'`;
    };

    const dtInicio = safeDateParam(filters.dtInicio);
    const dtFinal = safeDateParam(filters.dtFinal);
    const codTransp = Math.abs(Math.floor(Number(filters.codTransp) || 0));

    const query = `
      DECLARE @dt_inicio  DATETIME      = ${dtInicio};
      DECLARE @dt_final   DATETIME      = ${dtFinal};
      DECLARE @cod_transp NUMERIC(18,0) = ${codTransp};
      DECLARE @hoje       DATE          = CONVERT(DATE, GETDATE());

      ;WITH base AS (
          SELECT
              e.entrada,
              e.dataentra,
              e.datasaida,
              e.flag_tipo,
              t.nomefantasia AS transportadora,
              m.nome         AS motorista,
              m.cpf          AS cpf_motorista,
              d.abreviatura,

              COALESCE(
                  cli_di.nomefantasia,
                  cli_dta.nomefantasia,
                  cli_conh.nomefantasia
              ) AS beneficiario,

              e.placa,
              e.placa_boogie
          FROM dbo.entrada e

          JOIN dbo.transportadora t
              ON t.cod_transp = e.cod_transp

          LEFT JOIN dbo.motoristas m
              ON m.cod_motorista = e.cod_motorista

          LEFT JOIN dbo.entradadoc ed
              ON ed.entrada = e.entrada

          LEFT JOIN dbo.documentos d
              ON d.cod_doc = ed.cod_doc

          LEFT JOIN dbo.registro_di rdi
              ON rdi.n_di = ed.n_documento

          LEFT JOIN dbo.clientes cli_di
              ON cli_di.cod_cli = rdi.cod_cli

          LEFT JOIN dbo.sys_dta_antecipada dta
              ON dta.n_documento = ed.n_documento

          LEFT JOIN dbo.clientes cli_dta
              ON cli_dta.cod_cli = dta.cod_beneficiario

          LEFT JOIN dbo.doc_conhecimento dc
              ON dc.n_documento = ed.n_documento

          LEFT JOIN dbo.clientes cli_conh
              ON cli_conh.cod_cli = dc.consignatario

          WHERE e.cancelada = 0
            AND e.flag_tipo = 1
            AND (@dt_inicio IS NULL OR e.dataentra >= @dt_inicio)
            AND (@dt_final  IS NULL OR e.dataentra <= @dt_final)
            AND (e.datasaida IS NULL OR e.datasaida >= @hoje)
            AND (@cod_transp = 0 OR e.cod_transp = @cod_transp)
      )

      SELECT
          b.entrada               AS entryNumber,
          MIN(b.dataentra)        AS entryDate,
          MAX(b.datasaida)        AS exitDate,

          'RECEBIMENTO'           AS status,
          'ENTRADA CONTAINER'     AS tipoEntrada,

          MAX(b.transportadora)   AS carrier,
          MAX(b.abreviatura)      AS abreviatura,
          MAX(b.placa)            AS licensePlate,
          MAX(b.placa_boogie)     AS licensePlateBoogie,

          ec.n_ctnr               AS containerNumber,
          MAX(ec.lacre_orig_1)    AS lacre,

          CASE
              WHEN COUNT(DISTINCT b.beneficiario) > 1 THEN 'DIVERSOS'
              ELSE MAX(b.beneficiario)
          END AS beneficiario,

          MAX(b.motorista)        AS motorista,
          MAX(b.cpf_motorista)    AS cpfMotorista,

          DATEDIFF(MINUTE, MIN(b.dataentra), ISNULL(MAX(b.datasaida), GETDATE())) AS tempoPermanencia,

          CASE
              WHEN DATEDIFF(HOUR, MIN(b.dataentra), ISNULL(MAX(b.datasaida), GETDATE())) > 72 THEN 'high'
              WHEN DATEDIFF(HOUR, MIN(b.dataentra), ISNULL(MAX(b.datasaida), GETDATE())) > 24 THEN 'medium'
              ELSE 'low'
          END AS priority

      FROM base b
      JOIN dbo.entradactnr ec
          ON  ec.entrada = b.entrada
          AND ec.n_ctnr IS NOT NULL
          AND LTRIM(RTRIM(ec.n_ctnr)) <> ''
      GROUP BY
          b.entrada,
          b.flag_tipo,
          ec.n_ctnr
      ORDER BY
          b.entrada,
          ec.n_ctnr;
    `;

    const sqlResults = await this.sqlServer.query<PendingContainerDto>(query);

    await this.syncContainerEntries(sqlResults, filters).catch((err) =>
      this.logger.warn(`syncContainerEntries failed: ${err}`),
    );

    if (sqlResults.length === 0) return [];

    const activeInspections = await this.prisma.inspectionMobile.findMany({
      where: { inspectionStatus: "in_progress" },
      select: { containerNumero: true, inspectionStatus: true },
    });

    // Normalize: remove spaces and hyphens, uppercase — handles format differences
    // between SQL Server ("ONEU6229541") and PostgreSQL ("ONEU 622954-1")
    const normalize = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();

    const inspectedSet = new Set(
      activeInspections.map((i) => normalize(i.containerNumero)),
    );

    this.logger.log(
      `getPendingContainers: ${sqlResults.length} SQL results, ` +
        `${activeInspections.length} active inspections in PG, ` +
        `inspectedSet: [${[...inspectedSet].join(", ")}]`,
    );

    const filtered = sqlResults.filter((c) => {
      if (!c.containerNumber) return true;
      // SQL Server may concatenate multiple containers: "ONEU6229541, MSKU1234567"
      const parts = c.containerNumber
        .split(",")
        .map((p) => normalize(p.trim()));
      const isInspected = parts.some((n) => inspectedSet.has(n));
      if (isInspected) {
        this.logger.log(
          `Filtering out container: "${c.containerNumber}" (normalized: [${parts.join(", ")}])`,
        );
      }
      return !isInspected;
    });

    this.logger.log(
      `getPendingContainers: returning ${filtered.length} of ${sqlResults.length} containers after filter`,
    );

    return filtered;
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

    const result = await this.prisma.$transaction(async (tx) => {
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
          ...(dto.inspecao717 !== undefined && { inspecao717: dto.inspecao717 as object }),
          ...(dto.inspecao717Header !== undefined && { inspecao717Header: dto.inspecao717Header as object }),
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

    if (dto.inspectionStatus === 'completed') {
      await this.updateContainerEntryStatus(existing.containerNumero, 'completed');
    } else if (dto.inspectionStatus === 'in_progress') {
      await this.updateContainerEntryStatus(existing.containerNumero, 'in_progress');
    }

    return result;
  }
}
