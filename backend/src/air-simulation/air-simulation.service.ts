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
  ServiceCalculationType,
} from "@prisma/client-postgres";

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

  // ========== CRIAÇÃO ==========

  async create(createAirSimulationDto: CreateAirSimulationDto, userId: string) {
    try {
      console.log("[AIR SIMULATION CREATE] DTO:", createAirSimulationDto);

      const customer = await this.prisma.customer.findUnique({
        where: { id: createAirSimulationDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException(
          `Cliente com ID ${createAirSimulationDto.customerId} não encontrado`,
        );
      }

      const simulationNumber = this.generateSimulationNumber();
      const displayNumber = this.generateDisplayNumber(simulationNumber, 1);

      // Arredondamento para evitar dízimas decimais em cálculos financeiros
      const cifBrl = Number(
        (
          createAirSimulationDto.cifUsd * createAirSimulationDto.dollarRate
        ).toFixed(2),
      );

      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Cria a AirSimulation (Capa)
        const simulation = await tx.airSimulation.create({
          data: {
            simulationNumber,
            customer: { connect: { id: createAirSimulationDto.customerId } },
          },
        });

        // 2. Cria a primeira AirSimulationVersion
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
            transportCost: new Prisma.Decimal(
              createAirSimulationDto.transportCost || 0,
            ),
            discount: new Prisma.Decimal(createAirSimulationDto.discount || 0),
            minBillingValue: new Prisma.Decimal(
              createAirSimulationDto.minBillingValue || 350,
            ),
            user: { connect: { id: userId } },
          },
        });

        // 3. Cria os AirSimulationService (itens/snapshot)
        if (
          createAirSimulationDto.initialServices &&
          createAirSimulationDto.initialServices.length > 0
        ) {
          const serviceIds = createAirSimulationDto.initialServices.map(
            (s) => s.serviceId,
          );
          const serviceDefinitions = await tx.service.findMany({
            where: { id: { in: serviceIds } },
          });

          const serviceRecords = createAirSimulationDto.initialServices.map(
            (s) => {
              const def = serviceDefinitions.find(
                (sd) => sd.id === s.serviceId,
              );

              if (!def) {
                throw new NotFoundException(
                  `Serviço ${s.serviceId} não encontrado.`,
                );
              }

              // Validação de segurança: Impede tipos de cálculo incompatíveis com o modal aéreo
              const rawCalcType = def.calculationType as string;
              if (
                rawCalcType === "PER_CONTAINER" ||
                rawCalcType === "PER_TONNE"
              ) {
                throw new BadRequestException(
                  `O serviço "${def.name}" (${rawCalcType}) é incompatível com o modal aéreo.`,
                );
              }

              return {
                versionId: version.id,
                serviceId: s.serviceId,
                serviceName: def.name,
                serviceCode: def.code,
                calculationType:
                  rawCalcType as unknown as AirServiceCalculationType,
                costType: s.costType,
                // Number() garante que o Prisma não receba 'any' ou 'string'
                originalCost: new Prisma.Decimal(Number(s.originalCost ?? 0)),
                appliedCost: new Prisma.Decimal(Number(s.appliedCost ?? 0)),
                customReason: s.customReason || null,
              };
            },
          );

          await tx.airSimulationService.createMany({ data: serviceRecords });
        }

        return { simulation, version };
      });

      // 4. Dispara o recálculo dos totais da versão recém-criada
      await this.recalculateTotals(result.version.id);

      return this.findOneVersion(result.version.id);
    } catch (error) {
      console.error("[AIR SIMULATION CREATE] Error:", error);
      throw error;
    }
  }

  // ========== NOVA VERSÃO ==========

  async createNewVersion(
    createNewVersionDto: CreateAirNewVersionDto,
    userId: string,
  ) {
    const baseVersion = await this.prisma.airSimulationVersion.findUnique({
      where: { id: createNewVersionDto.baseSimulationId },
      include: { simulation: true, services: true },
    });

    if (!baseVersion) {
      throw new NotFoundException(
        `Versão base com ID ${createNewVersionDto.baseSimulationId} não encontrada`,
      );
    }

    const maxVersion = await this.prisma.airSimulationVersion.findFirst({
      where: { simulationId: baseVersion.simulationId },
      orderBy: { version: "desc" },
    });

    const newVersionNumber = (maxVersion?.version || 0) + 1;
    const displayNumber = this.generateDisplayNumber(
      baseVersion.simulation.simulationNumber,
      newVersionNumber,
    );
    const cifBrl = createNewVersionDto.cifUsd * createNewVersionDto.dollarRate;

    const newVersionId = await this.prisma.$transaction(async (tx) => {
      await tx.airSimulationVersion.updateMany({
        where: { simulationId: baseVersion.simulationId },
        data: { isCurrentVersion: false },
      });

      const newVersion = await tx.airSimulationVersion.create({
        data: {
          simulation: { connect: { id: baseVersion.simulationId } },
          baseVersion: { connect: { id: baseVersion.id } },
          version: newVersionNumber,
          displayNumber,
          isCurrentVersion: true,
          versionReason: createNewVersionDto.versionReason || null,
          cifUsd: new Prisma.Decimal(createNewVersionDto.cifUsd),
          dollarRate: new Prisma.Decimal(createNewVersionDto.dollarRate),
          cifBrl: new Prisma.Decimal(cifBrl),
          weightKg: createNewVersionDto.weightKg
            ? new Prisma.Decimal(createNewVersionDto.weightKg)
            : null,
          volumeM3: createNewVersionDto.volumeM3
            ? new Prisma.Decimal(createNewVersionDto.volumeM3)
            : null,
          storageCost: new Prisma.Decimal(createNewVersionDto.storageCost || 0),
          transportCost: new Prisma.Decimal(
            createNewVersionDto.transportCost || 0,
          ),
          discount: new Prisma.Decimal(createNewVersionDto.discount || 0),
          minBillingValue: new Prisma.Decimal(
            createNewVersionDto.minBillingValue || 350,
          ),
          user: { connect: { id: userId } },
        },
      });

      if (baseVersion.services.length > 0) {
        const clonedServices = baseVersion.services.map((s) => ({
          versionId: newVersion.id,
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          serviceCode: s.serviceCode,
          calculationType:
            s.calculationType as unknown as AirServiceCalculationType,
          costType: s.costType,
          originalCost: s.originalCost,
          appliedCost: s.appliedCost,
          customReason: s.customReason,
        }));

        await tx.airSimulationService.createMany({ data: clonedServices });
      }

      await this.recalculateTotals(newVersion.id, tx);

      return newVersion.id;
    });

    return this.findOneVersion(newVersionId);
  }

  // ========== BUSCA ==========

  async findAll(customerId?: string) {
    return this.prisma.airSimulation.findMany({
      where: customerId ? { customerId } : {},
      include: {
        customer: true,
        versions: {
          where: { isCurrentVersion: true },
          take: 1,
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { services: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const simulation = await this.prisma.airSimulation.findUnique({
      where: { id },
      include: {
        customer: true,
        versions: {
          where: { isCurrentVersion: true },
          take: 1,
          include: {
            user: { select: { id: true, name: true, email: true } },
            services: true,
          },
        },
      },
    });

    if (simulation) {
      const currentVersion = simulation.versions[0];
      return this.formatVersionResponse(simulation, currentVersion);
    }

    return this.findOneVersion(id);
  }

  async findOneVersion(versionId: string) {
    const version = await this.prisma.airSimulationVersion.findUnique({
      where: { id: versionId },
      include: {
        simulation: { include: { customer: true } },
        user: { select: { id: true, name: true, email: true } },
        services: true,
      },
    });

    if (!version) {
      throw new NotFoundException(`Versão com ID ${versionId} não encontrada`);
    }

    return this.formatVersionResponse(version.simulation, version);
  }

  private formatVersionResponse(simulation: any, version: any) {
    if (!version) return null;
    return {
      id: version.id,
      simulationId: simulation.id,
      simulationNumber: simulation.simulationNumber,
      version: version.version,
      displayNumber: version.displayNumber,
      isCurrentVersion: version.isCurrentVersion,
      versionReason: version.versionReason,
      status: version.status,
      customerId: simulation.customerId,
      customer: simulation.customer,
      user: version.user,
      cifUsd: version.cifUsd,
      dollarRate: version.dollarRate,
      cifBrl: version.cifBrl,
      weightKg: version.weightKg,
      volumeM3: version.volumeM3,
      storageCost: version.storageCost,
      transportCost: version.transportCost,
      discount: version.discount,
      totalServices: version.totalServices,
      totalGeneral: version.totalGeneral,
      minBillingValue: version.minBillingValue,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
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

  async getVersionHistory(simulationNumber: string) {
    return this.prisma.airSimulationVersion.findMany({
      where: { simulation: { simulationNumber } },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { services: true } },
      },
      orderBy: { version: "desc" },
    });
  }

  // ========== ATUALIZAÇÃO ==========

  async update(id: string, updateAirSimulationDto: UpdateAirSimulationDto) {
    const version = await this.prisma.airSimulationVersion.findUnique({
      where: { id },
    });
    if (!version) {
      throw new NotFoundException(`Versão com ID ${id} não encontrada`);
    }

    const updateData: any = {};

    if (updateAirSimulationDto.cifUsd !== undefined) {
      updateData.cifUsd = new Prisma.Decimal(updateAirSimulationDto.cifUsd);
    }
    if (updateAirSimulationDto.dollarRate !== undefined) {
      updateData.dollarRate = new Prisma.Decimal(
        updateAirSimulationDto.dollarRate,
      );
    }
    if (updateAirSimulationDto.weightKg !== undefined) {
      updateData.weightKg = updateAirSimulationDto.weightKg
        ? new Prisma.Decimal(updateAirSimulationDto.weightKg)
        : null;
    }
    if (updateAirSimulationDto.volumeM3 !== undefined) {
      updateData.volumeM3 = updateAirSimulationDto.volumeM3
        ? new Prisma.Decimal(updateAirSimulationDto.volumeM3)
        : null;
    }
    if (updateAirSimulationDto.storageCost !== undefined) {
      updateData.storageCost = new Prisma.Decimal(
        updateAirSimulationDto.storageCost,
      );
    }
    if (updateAirSimulationDto.transportCost !== undefined) {
      updateData.transportCost = new Prisma.Decimal(
        updateAirSimulationDto.transportCost,
      );
    }
    if (updateAirSimulationDto.discount !== undefined) {
      updateData.discount = new Prisma.Decimal(updateAirSimulationDto.discount);
    }
    if (updateAirSimulationDto.status) {
      updateData.status = updateAirSimulationDto.status;
    }
    if (updateAirSimulationDto.minBillingValue !== undefined) {
      updateData.minBillingValue = new Prisma.Decimal(
        updateAirSimulationDto.minBillingValue,
      );
    }

    if (
      updateAirSimulationDto.cifUsd !== undefined ||
      updateAirSimulationDto.dollarRate !== undefined
    ) {
      const newCifUsd = updateAirSimulationDto.cifUsd ?? Number(version.cifUsd);
      const newDollarRate =
        updateAirSimulationDto.dollarRate ?? Number(version.dollarRate);
      updateData.cifBrl = new Prisma.Decimal(newCifUsd * newDollarRate);
    }

    await this.prisma.airSimulationVersion.update({
      where: { id },
      data: updateData,
    });

    await this.recalculateAllServices(id);

    return this.findOneVersion(id);
  }

  async remove(id: string) {
    const version = await this.prisma.airSimulationVersion.findUnique({
      where: { id },
    });
    if (!version) {
      throw new NotFoundException(`Versão com ID ${id} não encontrada`);
    }

    if (version.status !== "DRAFT") {
      throw new BadRequestException(
        `Não é possível deletar simulação com status ${version.status}. Apenas DRAFT pode ser deletada.`,
      );
    }

    return this.prisma.airSimulationVersion.delete({ where: { id } });
  }

  // ========== GERENCIAMENTO DE SERVIÇOS ==========

  async addService(versionId: string, dto: AddAirSimulationServiceDto) {
    const version = await this.prisma.airSimulationVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) {
      throw new NotFoundException(`Versão com ID ${versionId} não encontrada`);
    }

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(
        `Serviço com ID ${dto.serviceId} não encontrado`,
      );
    }

    // Proteção contra tipos de cálculo incompatíveis com modal Aéreo
    if (
      service.calculationType === ServiceCalculationType.PER_CONTAINER ||
      (service.calculationType as string) === "PER_TONNE"
    ) {
      throw new BadRequestException(
        "Este serviço utiliza cálculo por Container/Tonelada e não é permitido no modal Aéreo.",
      );
    }

    // Cast seguro para o enum Aéreo
    const airCalcType =
      service.calculationType as unknown as AirServiceCalculationType;

    const currentCost = await this.prisma.serviceCost.findFirst({
      where: {
        serviceId: dto.serviceId,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      orderBy: { validFrom: "desc" },
    });

    if (!currentCost && dto.costType === ServiceCostType.DEFAULT) {
      throw new BadRequestException(
        `Serviço ${service.name} não possui custo vigente`,
      );
    }

    const rate = dto.originalCost ?? Number(currentCost?.cost || 0);
    let appliedCost: number;

    if (dto.costType === ServiceCostType.DEFAULT) {
      this.calculationService.validateSimulationData(airCalcType, {
        cifBrl: Number(version.cifBrl),
        weightKg: version.weightKg ? Number(version.weightKg) : undefined,
        volumeM3: version.volumeM3 ? Number(version.volumeM3) : undefined,
      });
      appliedCost = this.calculationService.calculateServiceCost(
        airCalcType,
        rate,
        {
          cifBrl: Number(version.cifBrl),
          weightKg: version.weightKg ? Number(version.weightKg) : undefined,
          volumeM3: version.volumeM3 ? Number(version.volumeM3) : undefined,
        },
      );
    } else if (dto.costType === ServiceCostType.ZEROED) {
      appliedCost = 0;
    } else if (dto.costType === ServiceCostType.CUSTOM) {
      if (!dto.customReason)
        throw new BadRequestException("Custo customizado requer motivo");
      if (dto.appliedCost === undefined)
        throw new BadRequestException("Custo customizado requer valor");
      appliedCost = dto.appliedCost;
    } else {
      appliedCost = dto.appliedCost || 0;
    }

    const existing = await this.prisma.airSimulationService.findFirst({
      where: { versionId, serviceId: dto.serviceId },
    });

    if (existing) {
      await this.prisma.airSimulationService.update({
        where: { id: existing.id },
        data: {
          costType: dto.costType,
          originalCost: new Prisma.Decimal(rate),
          appliedCost: new Prisma.Decimal(appliedCost),
          customReason: dto.customReason || null,
        },
      });
    } else {
      await this.prisma.airSimulationService.create({
        data: {
          versionId,
          serviceId: dto.serviceId,
          serviceName: service.name,
          serviceCode: service.code,
          calculationType: airCalcType,
          costType: dto.costType,
          originalCost: new Prisma.Decimal(rate),
          appliedCost: new Prisma.Decimal(appliedCost),
          customReason: dto.customReason || null,
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
    return { message: "Serviço removido com sucesso" };
  }

  async getServices(versionId: string) {
    const services = await this.prisma.airSimulationService.findMany({
      where: { versionId },
    });
    return services.map((s) => ({
      ...s,
      service: {
        id: s.serviceId,
        name: s.serviceName,
        code: s.serviceCode,
        calculationType: s.calculationType,
      },
    }));
  }

  // ========== RECÁLCULOS ==========

  private async recalculateTotals(
    versionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const version = await prisma.airSimulationVersion.findUnique({
      where: { id: versionId },
      include: { services: true },
    });

    if (!version) return;

    const totalServices = version.services.reduce(
      (sum, s) => sum + Number(s.appliedCost),
      0,
    );
    const storageCost = Number(version.storageCost || 0);
    const transportCost = Number(version.transportCost || 0);
    const discount = Number(version.discount || 0);
    const minBillingValue = Number(version.minBillingValue || 350);

    const minDiff =
      totalServices < minBillingValue ? minBillingValue - totalServices : 0;
    const totalGeneral =
      totalServices + minDiff + storageCost + transportCost - discount;

    await prisma.airSimulationVersion.update({
      where: { id: versionId },
      data: {
        totalServices: new Prisma.Decimal(totalServices),
        totalGeneral: new Prisma.Decimal(totalGeneral),
      },
    });
  }

  private async recalculateAllServices(versionId: string) {
    const version = await this.prisma.airSimulationVersion.findUnique({
      where: { id: versionId },
      include: { services: true },
    });

    if (!version) return;

    for (const simService of version.services) {
      if (simService.costType === ServiceCostType.DEFAULT) {
        try {
          const newCost = this.calculationService.calculateServiceCost(
            simService.calculationType as unknown as AirServiceCalculationType,
            Number(simService.originalCost),
            {
              cifBrl: Number(version.cifBrl),
              weightKg: version.weightKg ? Number(version.weightKg) : undefined,
              volumeM3: version.volumeM3 ? Number(version.volumeM3) : undefined,
            },
          );

          if (Number(simService.appliedCost) !== newCost) {
            await this.prisma.airSimulationService.update({
              where: { id: simService.id },
              data: { appliedCost: new Prisma.Decimal(newCost) },
            });
          }
        } catch (error) {
          console.error(
            `Error recalculating service ${simService.serviceId}:`,
            error,
          );
        }
      }
    }

    await this.recalculateTotals(versionId);
  }
}
