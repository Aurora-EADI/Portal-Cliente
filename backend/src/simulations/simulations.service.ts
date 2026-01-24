import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { CalculationService } from "./calculation.service";
import { CreateSimulationDto } from "./dto/create-simulation.dto";
import { UpdateSimulationDto } from "./dto/update-simulation.dto";
import { CreateNewVersionDto } from "./dto/create-new-version.dto";
import { AddSimulationServiceDto } from "./dto/add-simulation-service.dto";
import { ServiceCostType, Prisma } from "@prisma/client-postgres";

@Injectable()
export class SimulationsService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly calculationService: CalculationService,
  ) {}

  private generateSimulationNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `SIM-${dateStr}-${random}`;
  }

  private generateDisplayNumber(
    simulationNumber: string,
    version: number,
  ): string {
    const sequential = simulationNumber.split("-")[2];
    return `SIM-${sequential}-V${version}`;
  }

  // ========== CRIAÇÃO ==========

  async create(createSimulationDto: CreateSimulationDto, userId: string) {
    try {
      console.log("[SIMULATION CREATE] DTO:", createSimulationDto);

      const customer = await this.prisma.customer.findUnique({
        where: { id: createSimulationDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException(
          `Cliente com ID ${createSimulationDto.customerId} não encontrado`,
        );
      }

      const simulationNumber = this.generateSimulationNumber();
      const displayNumber = this.generateDisplayNumber(simulationNumber, 1);
      const cifBrl =
        createSimulationDto.cifUsd * createSimulationDto.dollarRate;

      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Cria a Simulation (Capa)
        const simulation = await tx.simulation.create({
          data: {
            simulationNumber,
            customer: { connect: { id: createSimulationDto.customerId } },
          },
        });

        // 2. Cria a primeira SimulationVersion
        const version = await tx.simulationVersion.create({
          data: {
            simulation: { connect: { id: simulation.id } },
            version: 1,
            displayNumber,
            isCurrentVersion: true,
            cifUsd: new Prisma.Decimal(createSimulationDto.cifUsd),
            dollarRate: new Prisma.Decimal(createSimulationDto.dollarRate),
            cifBrl: new Prisma.Decimal(cifBrl),
            tonnes: createSimulationDto.tonnes
              ? new Prisma.Decimal(createSimulationDto.tonnes)
              : null,
            cntrCount: createSimulationDto.cntrCount || null,
            cntrType: createSimulationDto.cntrType || null,
            storageCost: new Prisma.Decimal(
              createSimulationDto.storageCost || 0,
            ),
            transportCost: new Prisma.Decimal(
              createSimulationDto.transportCost || 0,
            ),
            discount: new Prisma.Decimal(createSimulationDto.discount || 0),
            hasStripping: createSimulationDto.hasStripping || false,
            minBillingValue: new Prisma.Decimal(
              createSimulationDto.minBillingValue || 5500,
            ),
            user: { connect: { id: userId } },
          },
        });

        // 3. Cria os SimulationService (itens/snapshot)
        if (
          createSimulationDto.initialServices &&
          createSimulationDto.initialServices.length > 0
        ) {
          const serviceIds = createSimulationDto.initialServices.map(
            (s) => s.serviceId,
          );
          const serviceDefinitions = await tx.service.findMany({
            where: { id: { in: serviceIds } },
          });

          const serviceRecords = createSimulationDto.initialServices.map(
            (s) => {
              const def = serviceDefinitions.find(
                (sd) => sd.id === s.serviceId,
              );
              return {
                versionId: version.id,
                serviceId: s.serviceId,
                serviceName: def?.name || "Serviço Removido",
                serviceCode: def?.code || "N/A",
                calculationType: def?.calculationType || "FIXED",
                hasStripping: def?.hasStripping || false,
                costType: s.costType,
                originalCost: new Prisma.Decimal(s.originalCost ?? 0),
                appliedCost: new Prisma.Decimal(s.appliedCost ?? 0),
                customReason: s.customReason || null,
              };
            },
          );

          await tx.simulationService.createMany({ data: serviceRecords });
        }

        return { simulation, version };
      });

      // Recalcula totais
      await this.recalculateTotals(result.version.id);

      return this.findOneVersion(result.version.id);
    } catch (error) {
      console.error("[SIMULATION CREATE] Error:", error);
      throw error;
    }
  }

  // ========== NOVA VERSÃO ==========

  async createNewVersion(
    createNewVersionDto: CreateNewVersionDto,
    userId: string,
  ) {
    // Busca a versão base
    const baseVersion = await this.prisma.simulationVersion.findUnique({
      where: { id: createNewVersionDto.baseSimulationId },
      include: { simulation: true, services: true },
    });

    if (!baseVersion) {
      throw new NotFoundException(
        `Versão base com ID ${createNewVersionDto.baseSimulationId} não encontrada`,
      );
    }

    // Busca a maior versão existente
    const maxVersion = await this.prisma.simulationVersion.findFirst({
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
      // Marca todas as versões anteriores como não-correntes
      await tx.simulationVersion.updateMany({
        where: { simulationId: baseVersion.simulationId },
        data: { isCurrentVersion: false },
      });

      // Cria a nova versão
      const newVersion = await tx.simulationVersion.create({
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
          tonnes: createNewVersionDto.tonnes
            ? new Prisma.Decimal(createNewVersionDto.tonnes)
            : null,
          cntrCount: createNewVersionDto.cntrCount || null,
          cntrType: createNewVersionDto.cntrType || null,
          storageCost: new Prisma.Decimal(createNewVersionDto.storageCost || 0),
          transportCost: new Prisma.Decimal(
            createNewVersionDto.transportCost || 0,
          ),
          discount: new Prisma.Decimal(createNewVersionDto.discount || 0),
          hasStripping: createNewVersionDto.hasStripping || false,
          minBillingValue: new Prisma.Decimal(
            createNewVersionDto.minBillingValue || 5500,
          ),
          user: { connect: { id: userId } },
        },
      });

      // Clona os serviços da versão base
      if (baseVersion.services.length > 0) {
        const clonedServices = baseVersion.services.map((s) => ({
          versionId: newVersion.id,
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          serviceCode: s.serviceCode,
          calculationType: s.calculationType,
          hasStripping: s.hasStripping,
          costType: s.costType,
          originalCost: s.originalCost,
          appliedCost: s.appliedCost,
          customReason: s.customReason,
        }));

        await tx.simulationService.createMany({ data: clonedServices });
      }

      // Recalcula totais
      await this.recalculateTotals(newVersion.id, tx);

      return newVersion.id;
    });

    // Busca a versão completa APÓS a transação ser commitada
    return this.findOneVersion(newVersionId);
  }

  // ========== BUSCA ==========

  async findAll(customerId?: string) {
    // Agora buscamos Simulations (Capa) e a versão corrente
    return this.prisma.simulation.findMany({
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
    // ID pode ser da Simulation (capa) ou da SimulationVersion
    // Primeiro, tentamos buscar como Simulation
    const simulation = await this.prisma.simulation.findUnique({
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
      // Retorna a versão corrente em formato compatível
      const currentVersion = simulation.versions[0];
      return this.formatVersionResponse(simulation, currentVersion);
    }

    // Se não encontrou como Simulation, tenta como SimulationVersion
    return this.findOneVersion(id);
  }

  async findOneVersion(versionId: string) {
    const version = await this.prisma.simulationVersion.findUnique({
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
      tonnes: version.tonnes,
      cntrCount: version.cntrCount,
      cntrType: version.cntrType,
      storageCost: version.storageCost,
      transportCost: version.transportCost,
      discount: version.discount,
      totalServices: version.totalServices,
      totalGeneral: version.totalGeneral,
      hasStripping: version.hasStripping,
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
            hasStripping: s.hasStripping,
          },
        })) || [],
    };
  }

  async getVersionHistory(simulationNumber: string) {
    return this.prisma.simulationVersion.findMany({
      where: { simulation: { simulationNumber } },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { services: true } },
      },
      orderBy: { version: "desc" },
    });
  }

  // ========== ATUALIZAÇÃO ==========

  async update(id: string, updateSimulationDto: UpdateSimulationDto) {
    // Busca a versão
    const version = await this.prisma.simulationVersion.findUnique({
      where: { id },
    });
    if (!version) {
      throw new NotFoundException(`Versão com ID ${id} não encontrada`);
    }

    const updateData: any = {};

    if (updateSimulationDto.cifUsd !== undefined) {
      updateData.cifUsd = new Prisma.Decimal(updateSimulationDto.cifUsd);
    }
    if (updateSimulationDto.dollarRate !== undefined) {
      updateData.dollarRate = new Prisma.Decimal(
        updateSimulationDto.dollarRate,
      );
    }
    if (updateSimulationDto.tonnes !== undefined) {
      updateData.tonnes = updateSimulationDto.tonnes
        ? new Prisma.Decimal(updateSimulationDto.tonnes)
        : null;
    }
    if (updateSimulationDto.cntrCount !== undefined) {
      updateData.cntrCount = updateSimulationDto.cntrCount || null;
    }
    if (updateSimulationDto.cntrType !== undefined) {
      updateData.cntrType = updateSimulationDto.cntrType || null;
    }
    if (updateSimulationDto.storageCost !== undefined) {
      updateData.storageCost = new Prisma.Decimal(
        updateSimulationDto.storageCost,
      );
    }
    if (updateSimulationDto.transportCost !== undefined) {
      updateData.transportCost = new Prisma.Decimal(
        updateSimulationDto.transportCost,
      );
    }
    if (updateSimulationDto.discount !== undefined) {
      updateData.discount = new Prisma.Decimal(updateSimulationDto.discount);
    }
    if (updateSimulationDto.status) {
      updateData.status = updateSimulationDto.status;
    }
    if (updateSimulationDto.hasStripping !== undefined) {
      updateData.hasStripping = updateSimulationDto.hasStripping;
    }
    if (updateSimulationDto.minBillingValue !== undefined) {
      updateData.minBillingValue = new Prisma.Decimal(
        updateSimulationDto.minBillingValue,
      );
    }

    // Recalcula CIF BRL
    if (
      updateSimulationDto.cifUsd !== undefined ||
      updateSimulationDto.dollarRate !== undefined
    ) {
      const newCifUsd = updateSimulationDto.cifUsd ?? Number(version.cifUsd);
      const newDollarRate =
        updateSimulationDto.dollarRate ?? Number(version.dollarRate);
      updateData.cifBrl = new Prisma.Decimal(newCifUsd * newDollarRate);
    }

    await this.prisma.simulationVersion.update({
      where: { id },
      data: updateData,
    });

    // Se desativou desova, remove os serviços de desova
    if (updateSimulationDto.hasStripping === false) {
      await this.prisma.simulationService.deleteMany({
        where: { versionId: id, hasStripping: true },
      });
    }

    // Recalcula custos
    await this.recalculateAllServices(id);

    return this.findOneVersion(id);
  }

  async remove(id: string) {
    const version = await this.prisma.simulationVersion.findUnique({
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

    // Deleta a versão (e os serviços via onDelete: Cascade)
    return this.prisma.simulationVersion.delete({ where: { id } });
  }

  // ========== GERENCIAMENTO DE SERVIÇOS ==========

  async addService(
    versionId: string,
    dto: AddSimulationServiceDto,
    userId: string,
  ) {
    const version = await this.prisma.simulationVersion.findUnique({
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

    // Busca custo vigente
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
      this.calculationService.validateSimulationData(service.calculationType, {
        cifBrl: Number(version.cifBrl),
        cntrCount: version.cntrCount || undefined,
        tonnes: version.tonnes ? Number(version.tonnes) : undefined,
      });
      appliedCost = this.calculationService.calculateServiceCost(
        service.calculationType,
        rate,
        {
          cifBrl: Number(version.cifBrl),
          cntrCount: version.cntrCount || undefined,
          tonnes: version.tonnes ? Number(version.tonnes) : undefined,
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

    // Verifica se já existe
    const existing = await this.prisma.simulationService.findFirst({
      where: { versionId, serviceId: dto.serviceId },
    });

    if (existing) {
      await this.prisma.simulationService.update({
        where: { id: existing.id },
        data: {
          costType: dto.costType,
          originalCost: new Prisma.Decimal(rate),
          appliedCost: new Prisma.Decimal(appliedCost),
          customReason: dto.customReason || null,
        },
      });
    } else {
      await this.prisma.simulationService.create({
        data: {
          versionId,
          serviceId: dto.serviceId,
          serviceName: service.name,
          serviceCode: service.code,
          calculationType: service.calculationType,
          hasStripping: service.hasStripping,
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
    await this.prisma.simulationService.deleteMany({
      where: { versionId, serviceId },
    });
    await this.recalculateTotals(versionId);
    return { message: "Serviço removido com sucesso" };
  }

  async getServices(versionId: string) {
    const services = await this.prisma.simulationService.findMany({
      where: { versionId },
    });
    return services.map((s) => ({
      ...s,
      service: {
        id: s.serviceId,
        name: s.serviceName,
        code: s.serviceCode,
        calculationType: s.calculationType,
        hasStripping: s.hasStripping,
      },
    }));
  }

  // ========== RECÁLCULOS ==========

  private async recalculateTotals(
    versionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const version = await prisma.simulationVersion.findUnique({
      where: { id: versionId },
      include: { services: true },
    });

    if (!version) return;

    const effectiveServices = version.services.filter((s) => {
      if (!version.hasStripping && s.hasStripping) return false;
      return true;
    });

    const totalServices = effectiveServices.reduce(
      (sum, s) => sum + Number(s.appliedCost),
      0,
    );
    const storageCost = Number(version.storageCost || 0);
    const transportCost = Number(version.transportCost || 0);
    const discount = Number(version.discount || 0);
    const cntrCount = Number(version.cntrCount || 0);
    const minBillingPerCntr = Number(version.minBillingValue || 5500);
    const minBillingThreshold = minBillingPerCntr * cntrCount;
    const minDiff =
      totalServices < minBillingThreshold
        ? minBillingThreshold - totalServices
        : 0;
    const totalGeneral =
      totalServices + minDiff + storageCost + transportCost - discount;

    await prisma.simulationVersion.update({
      where: { id: versionId },
      data: {
        totalServices: new Prisma.Decimal(totalServices),
        totalGeneral: new Prisma.Decimal(totalGeneral),
      },
    });
  }

  private async recalculateAllServices(versionId: string) {
    const version = await this.prisma.simulationVersion.findUnique({
      where: { id: versionId },
      include: { services: true },
    });

    if (!version) return;

    for (const simService of version.services) {
      if (simService.costType === ServiceCostType.DEFAULT) {
        try {
          const newCost = this.calculationService.calculateServiceCost(
            simService.calculationType,
            Number(simService.originalCost),
            {
              cifBrl: Number(version.cifBrl),
              cntrCount: version.cntrCount || undefined,
              tonnes: version.tonnes ? Number(version.tonnes) : undefined,
            },
          );

          if (Number(simService.appliedCost) !== newCost) {
            await this.prisma.simulationService.update({
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
