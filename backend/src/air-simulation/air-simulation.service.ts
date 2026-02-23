import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { AirCalculationService } from "./air-calculation.service";
import { CreateAirSimulationDto } from "./dto/create-air-simulation.dto";
import { UpdateAirSimulationDto } from "./dto/update-air-simulation.dto";
import { CreateAirNewVersionDto } from "./dto/create-air-new-version.dto";
import { AddAirSimulationServiceDto } from "./dto/add-air-simulation-service.dto";
import {
  ServiceCostType,
  Prisma,
  AirServiceCalculationType,
} from "@prisma/client";

@Injectable()
export class AirSimulationsService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly calculationService: AirCalculationService,
  ) {}

  private generateSimulationNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `AIR-${dateStr}-${random}`;
  }

  private generateDisplayNumber(
    simulationNumber: string,
    version: number,
  ): string {
    const sequential = simulationNumber.split("-")[2];
    return `AIR-${sequential}-V${version}`;
  }

  // ========== CRIAÃ‡ÃƒO ==========

  async create(createAirSimulationDto: CreateAirSimulationDto, userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: createAirSimulationDto.customerId },
    });

    if (!customer) throw new NotFoundException(`Cliente nÃ£o encontrado`);

    const simulationNumber = this.generateSimulationNumber();
    const displayNumber = this.generateDisplayNumber(simulationNumber, 1);
    const cifBrl = Number(
      (
        createAirSimulationDto.cifUsd * createAirSimulationDto.dollarRate
      ).toFixed(2),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const simulation = await tx.airSimulation.create({
        data: {
          simulationNumber,
          customer: { connect: { id: createAirSimulationDto.customerId } },
        },
      });

      const version = await tx.airSimulationVersion.create({
        data: {
          simulation: { connect: { id: simulation.id } },
          version: 1,
          displayNumber,
          isCurrentVersion: true,
          cifUsd: new Prisma.Decimal(createAirSimulationDto.cifUsd),
          dollarRate: new Prisma.Decimal(createAirSimulationDto.dollarRate),
          cifBrl: new Prisma.Decimal(cifBrl),
          weightKg: createAirSimulationDto.weightKg
            ? new Prisma.Decimal(createAirSimulationDto.weightKg)
            : null,
          volumeM3: createAirSimulationDto.volumeM3
            ? new Prisma.Decimal(createAirSimulationDto.volumeM3)
            : null,
          storageCost: new Prisma.Decimal(
            createAirSimulationDto.storageCost || 0,
          ),
          capataziaCost: new Prisma.Decimal(
            createAirSimulationDto.capataziaCost || 0,
          ),
          transportCost: new Prisma.Decimal(
            createAirSimulationDto.transportCost || 0,
          ),
          discount: new Prisma.Decimal(createAirSimulationDto.discount || 0),
          minBillingValue: new Prisma.Decimal(
            createAirSimulationDto.minBillingValue || 350,
          ),
          auroraPeriods: createAirSimulationDto.auroraPeriods ?? 1,
          vinciPeriods: createAirSimulationDto.vinciPeriods ?? 1,
          user: { connect: { id: userId } },
        },
      });

      if (
        createAirSimulationDto.initialServices &&
        createAirSimulationDto.initialServices.length > 0
      ) {
        for (const s of createAirSimulationDto.initialServices) {
          const def = await tx.service.findUnique({
            where: { id: s.serviceId },
          });
          if (!def) continue;

          const airCalcType =
            def.calculationType as unknown as AirServiceCalculationType;
          const rate = s.originalCost ?? 0;
          const appliedCost = this.calculationService.calculateServiceCost(
            airCalcType,
            rate,
            {
              cifBrl,
              weightKg: Number(createAirSimulationDto.weightKg || 0),
              volumeM3: Number(createAirSimulationDto.volumeM3 || 0),
            },
          );

          await tx.airSimulationService.create({
            data: {
              versionId: version.id,
              serviceId: s.serviceId,
              serviceName: def.name,
              serviceCode: def.code,
              calculationType: airCalcType,
              costType: s.costType,
              originalCost: new Prisma.Decimal(rate),
              appliedCost: new Prisma.Decimal(appliedCost),
            },
          });
        }
      }
      return version;
    });

    await this.recalculateTotals(result.id);
    return this.findOneVersion(result.id);
  }

  // ========== NOVA VERSÃƒO ==========

  async createNewVersion(dto: CreateAirNewVersionDto, userId: string) {
    const baseVersion = await this.prisma.airSimulationVersion.findUnique({
      where: { id: dto.baseSimulationId },
      include: { simulation: true, services: true },
    });

    if (!baseVersion) throw new NotFoundException("VersÃ£o base nÃ£o encontrada");

    const maxVersion = await this.prisma.airSimulationVersion.findFirst({
      where: { simulationId: baseVersion.simulationId },
      orderBy: { version: "desc" },
    });

    const newVersionNumber = (maxVersion?.version || 0) + 1;
    const displayNumber = this.generateDisplayNumber(
      baseVersion.simulation.simulationNumber,
      newVersionNumber,
    );

    const newVersion = await this.prisma.$transaction(async (tx) => {
      await tx.airSimulationVersion.updateMany({
        where: { simulationId: baseVersion.simulationId },
        data: { isCurrentVersion: false },
      });

      const nv = await tx.airSimulationVersion.create({
        data: {
          simulationId: baseVersion.simulationId,
          version: newVersionNumber,
          displayNumber,
          isCurrentVersion: true,
          cifUsd: new Prisma.Decimal(dto.cifUsd),
          dollarRate: new Prisma.Decimal(dto.dollarRate),
          cifBrl: new Prisma.Decimal(dto.cifUsd * dto.dollarRate),
          weightKg: dto.weightKg ? new Prisma.Decimal(dto.weightKg) : null,
          volumeM3: dto.volumeM3 ? new Prisma.Decimal(dto.volumeM3) : null,
          storageCost: new Prisma.Decimal(dto.storageCost || 0),
          capataziaCost: new Prisma.Decimal(dto.capataziaCost || 0),
          transportCost: new Prisma.Decimal(dto.transportCost || 0),
          discount: new Prisma.Decimal(dto.discount || 0),
          minBillingValue: new Prisma.Decimal(dto.minBillingValue || 350),
          auroraPeriods: dto.auroraPeriods ?? baseVersion.auroraPeriods,
          vinciPeriods: dto.vinciPeriods ?? baseVersion.vinciPeriods,
          createdBy: userId,
        },
      });

      for (const s of baseVersion.services) {
        await tx.airSimulationService.create({
          data: {
            versionId: nv.id,
            serviceId: s.serviceId,
            serviceName: s.serviceName,
            serviceCode: s.serviceCode,
            calculationType: s.calculationType,
            costType: s.costType,
            originalCost: s.originalCost,
            appliedCost: s.appliedCost,
          },
        });
      }
      return nv;
    });

    await this.recalculateAllServices(newVersion.id);
    return this.findOneVersion(newVersion.id);
  }

  // ========== BUSCA ==========

  async findAll(customerId?: string) {
    return this.prisma.airSimulation.findMany({
      where: customerId ? { customerId } : {},
      include: {
        customer: true,
        versions: {
          where: { isCurrentVersion: true },
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    // Primeiro tenta buscar por ID da SimulaÃ§Ã£o (capa)
    const simulation = await this.prisma.airSimulation.findUnique({
      where: { id },
      include: { versions: { where: { isCurrentVersion: true }, take: 1 } },
    });

    if (simulation) {
      if (simulation.versions.length === 0) {
        throw new NotFoundException("Nenhuma versÃ£o ativa encontrada para esta simulaÃ§Ã£o");
      }
      return this.findOneVersion(simulation.versions[0].id);
    }

    // Se nÃ£o encontrou como Simulation, tenta buscar como AirSimulationVersion
    return this.findOneVersion(id);
  }

  async findOneVersion(versionId: string) {
    const version = await this.prisma.airSimulationVersion.findUnique({
      where: { id: versionId },
      include: {
        simulation: { 
          include: { 
            customer: true,
            versions: {
              orderBy: { version: "desc" },
              include: { user: { select: { id: true, name: true } } }
            }
          } 
        },
        user: { select: { id: true, name: true, email: true } },
        services: true,
      },
    });
    if (!version) throw new NotFoundException("VersÃ£o nÃ£o encontrada");
    return this.formatVersionResponse(version.simulation, version);
  }

  async getVersionHistory(simulationNumber: string) {
    return this.prisma.airSimulationVersion.findMany({
      where: { simulation: { simulationNumber } },
      include: { user: { select: { name: true } } },
      orderBy: { version: "desc" },
    });
  }

  private formatVersionResponse(simulation: any, version: any) {
    return {
      ...version,
      simulationId: simulation.id,
      simulationNumber: simulation.simulationNumber,
      customerId: simulation.customerId,
      customer: simulation.customer,
      versions: simulation.versions,
      services:
        version.services?.map((s: any) => ({
          ...s,
          service: {
            id: s.serviceId,
            name: s.serviceName,
            code: s.serviceCode,
            calculationType: s.calculationType,
          },
        })) || [],
    };
  }

  // ========== GERENCIAMENTO DE SERVIÃ‡OS ==========

  async getServices(versionId: string) {
    return this.prisma.airSimulationService.findMany({ where: { versionId } });
  }

  async addService(versionId: string, dto: AddAirSimulationServiceDto) {
    const version = await this.prisma.airSimulationVersion.findUnique({
      where: { id: versionId },
    });
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!version || !service)
      throw new NotFoundException("Dados nÃ£o encontrados");

    const currentCost = await this.prisma.serviceCost.findFirst({
      where: {
        serviceId: dto.serviceId,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });

    if (
      Number(currentCost?.cost) === 7.06 &&
      service.name.includes("MovimentaÃ§Ã£o")
    ) {
      throw new BadRequestException("Use o valor AÃ©reo de R$ 2,62.");
    }

    const rate = dto.originalCost ?? Number(currentCost?.cost || 0);
    let appliedCost: number;

    if (dto.costType === ServiceCostType.ZEROED) {
      appliedCost = 0;
    } else {
      appliedCost = this.calculationService.calculateServiceCost(
        service.calculationType as any,
        rate,
        {
          cifBrl: Number(version.cifBrl),
          weightKg: Number(version.weightKg),
          volumeM3: Number(version.volumeM3),
        },
      );
    }

    const existing = await this.prisma.airSimulationService.findFirst({
      where: { versionId, serviceId: dto.serviceId },
    });

    if (existing) {
      await this.prisma.airSimulationService.update({
        where: { id: existing.id },
        data: {
          appliedCost: new Prisma.Decimal(appliedCost),
          costType: dto.costType,
        },
      });
    } else {
      await this.prisma.airSimulationService.create({
        data: {
          versionId,
          serviceId: dto.serviceId,
          serviceName: service.name,
          serviceCode: service.code,
          calculationType: service.calculationType as any,
          originalCost: new Prisma.Decimal(rate),
          appliedCost: new Prisma.Decimal(appliedCost),
          costType: dto.costType,
        },
      });
    }

    await this.recalculateTotals(versionId);
    return this.findOneVersion(versionId);
  }

  async removeService(versionId: string, serviceId: string) {
    await this.prisma.airSimulationService.deleteMany({
      where: { versionId, serviceId },
    });
    await this.recalculateTotals(versionId);
    return { message: "Removido" };
  }

  // ========== RECÃLCULOS E TOTAIS ==========

  async update(id: string, dto: UpdateAirSimulationDto) {
    const version = await this.prisma.airSimulationVersion.findUnique({ where: { id } });
    if (!version) throw new NotFoundException("VersÃ£o nÃ£o encontrada");

    // Filtra apenas campos existentes na tabela AirSimulationVersion
    const { initialServices, customerId, ...updateData }: any = dto;

    // Recalcula CIF BRL se USD ou Taxa mudarem
    if (dto.cifUsd !== undefined || dto.dollarRate !== undefined) {
      const cif = dto.cifUsd ?? Number(version.cifUsd);
      const rate = dto.dollarRate ?? Number(version.dollarRate);
      updateData.cifBrl = new Prisma.Decimal(cif * rate);
    }

    await this.prisma.airSimulationVersion.update({ where: { id }, data: updateData });
    
    // Explicitly update periods if they are in the DTO (since they were removed by destructuring)
    if (dto.auroraPeriods !== undefined || dto.vinciPeriods !== undefined) {
      await this.prisma.airSimulationVersion.update({
        where: { id },
        data: {
          ...(dto.auroraPeriods !== undefined && { auroraPeriods: dto.auroraPeriods }),
          ...(dto.vinciPeriods !== undefined && { vinciPeriods: dto.vinciPeriods }),
        }
      });
    }

    await this.recalculateAllServices(id);
    return this.findOneVersion(id);
  }

  async remove(id: string) {
    return this.prisma.airSimulationVersion.delete({ where: { id } });
  }

  private async recalculateTotals(versionId: string) {
    const version = await this.prisma.airSimulationVersion.findUnique({
      where: { id: versionId },
      include: { services: true },
    });
    if (!version) return;

    const totalServices = version.services.reduce(
      (sum, s) => sum + Number(s.appliedCost),
      0,
    );

    const excludedServicesTotal = version.services.reduce((sum, s) => {
      const name = s.serviceName || '';
      const normalized = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const isExcluded =
        normalized.includes('transporte') && normalized.includes('dta');

      return isExcluded ? sum + Number(s.appliedCost) : sum;
    }, 0);

    const eligibleServicesTotal = totalServices - excludedServicesTotal;

    const baseForMin = Math.max(
      eligibleServicesTotal +
        Number(version.storageCost) +
        Number(version.capataziaCost),
      Number(version.minBillingValue),
    );

    await this.prisma.airSimulationVersion.update({
      where: { id: versionId },
      data: {
        totalServices: new Prisma.Decimal(totalServices),
        totalGeneral: new Prisma.Decimal(
          baseForMin +
            excludedServicesTotal +
            Number(version.transportCost) -
            Number(version.discount),
        ),
      },
    });
  }

  private async recalculateAllServices(versionId: string) {
    const version = await this.prisma.airSimulationVersion.findUnique({ where: { id: versionId }, include: { services: true } });
    if (!version) return;

    for (const s of version.services) {
      // PULA: Se o custo nÃ£o for DEFAULT, nÃ£o devemos sobrescrever o valor definido pelo usuÃ¡rio.
      if (s.costType !== ServiceCostType.DEFAULT) continue;

      try {
        const nc = this.calculationService.calculateServiceCost(s.calculationType as any, Number(s.originalCost), {
          cifBrl: Number(version.cifBrl), 
          weightKg: version.weightKg ? Number(version.weightKg) : undefined, 
          volumeM3: version.volumeM3 ? Number(version.volumeM3) : undefined 
        });
        
        if (Number(s.appliedCost) !== nc) {
          await this.prisma.airSimulationService.update({ where: { id: s.id }, data: { appliedCost: new Prisma.Decimal(nc) } });
        }
      } catch (error) {
        // Ignora erros de cÃ¡lculo se dados obrigatÃ³rios estiverem faltando (ex: peso ainda nÃ£o preenchido)
        console.warn(`Erro ao recalcular serviÃ§o ${s.serviceName}:`, error.message);
      }
    }
    await this.recalculateTotals(versionId);
  }
}

