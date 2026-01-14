import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaPostgresService } from '../prisma/prisma.service';
import { CalculationService } from './calculation.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { CreateNewVersionDto } from './dto/create-new-version.dto';
import { AddSimulationServiceDto } from './dto/add-simulation-service.dto';
import { ServiceCostType, Prisma } from '@prisma/client-postgres';

@Injectable()
export class SimulationsService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly calculationService: CalculationService,
  ) { }

  private generateSimulationNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `SIM-${dateStr}-${random}`;
  }

  private generateDisplayNumber(simulationNumber: string, version: number): string {
    // Extrai o número sequencial do simulationNumber (últimos 4 dígitos)
    const sequential = simulationNumber.split('-')[2];
    return `SIM-${sequential}-V${version}`;
  }

  async create(createSimulationDto: CreateSimulationDto, userId: string) {
    try {
      console.log('[SIMULATION CREATE] DTO:', createSimulationDto);
      console.log('[SIMULATION CREATE] UserId:', userId);

      // Verifica se o cliente existe
      const customer = await this.prisma.customer.findUnique({
        where: { id: createSimulationDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException(`Cliente com ID ${createSimulationDto.customerId} não encontrado`);
      }

      const simulationNumber = this.generateSimulationNumber();
      const displayNumber = this.generateDisplayNumber(simulationNumber, 1);

      console.log('[SIMULATION CREATE] Generated numbers:', { simulationNumber, displayNumber });

      // Calcula CIF BRL
      const cifBrl = createSimulationDto.cifUsd * createSimulationDto.dollarRate;

      // Prepara dados com conversões corretas
      const data: Prisma.SimulationCreateInput = {
        simulationNumber,
        version: 1,
        displayNumber,
        customer: {
          connect: { id: createSimulationDto.customerId },
        },
        user: {
          connect: { id: userId },
        },
        cifUsd: new Prisma.Decimal(createSimulationDto.cifUsd),
        dollarRate: new Prisma.Decimal(createSimulationDto.dollarRate),
        cifBrl: new Prisma.Decimal(cifBrl),
        tonnes: createSimulationDto.tonnes ? new Prisma.Decimal(createSimulationDto.tonnes) : null,
        cntrCount: createSimulationDto.cntrCount || null,
        cntrType: createSimulationDto.cntrType || null,
        storageCost: new Prisma.Decimal(createSimulationDto.storageCost || 0),
        transportCost: new Prisma.Decimal(createSimulationDto.transportCost || 0),
        discount: new Prisma.Decimal(createSimulationDto.discount || 0),
      };

      console.log('[SIMULATION CREATE] Data prepared:', JSON.stringify(data, null, 2));

      const result = await this.prisma.simulation.create({
        data,
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
              document: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      console.log('[SIMULATION CREATE] Success:', result.id);
      return result;
    } catch (error) {
      console.error('[SIMULATION CREATE] Error:', error);
      throw error;
    }
  }

  async createNewVersion(createNewVersionDto: CreateNewVersionDto, userId: string) {
    // Busca a simulação base
    const baseSimulation = await this.prisma.simulation.findUnique({
      where: { id: createNewVersionDto.baseSimulationId },
      include: {
        services: true, // Inclui os serviços para copiar
      },
    });

    if (!baseSimulation) {
      throw new NotFoundException(`Simulação base com ID ${createNewVersionDto.baseSimulationId} não encontrada`);
    }

    // Busca a maior versão existente
    const maxVersion = await this.prisma.simulation.findFirst({
      where: { simulationNumber: baseSimulation.simulationNumber },
      orderBy: { version: 'desc' },
    });

    const newVersion = (maxVersion?.version || 0) + 1;
    const displayNumber = this.generateDisplayNumber(baseSimulation.simulationNumber, newVersion);

    // Calcula CIF BRL
    const cifBrl = createNewVersionDto.cifUsd * createNewVersionDto.dollarRate;

    // Marca todas as versões anteriores como não-correntes
    await this.prisma.simulation.updateMany({
      where: { simulationNumber: baseSimulation.simulationNumber },
      data: { isCurrentVersion: false },
    });

    // Prepara dados com conversões corretas
    const dataNewVersion: Prisma.SimulationCreateInput = {
      simulationNumber: baseSimulation.simulationNumber,
      version: newVersion,
      displayNumber,
      baseSimulation: createNewVersionDto.baseSimulationId
        ? { connect: { id: createNewVersionDto.baseSimulationId } }
        : undefined,
      versionReason: createNewVersionDto.versionReason || null,
      customer: {
        connect: { id: createNewVersionDto.customerId },
      },
      user: {
        connect: { id: userId },
      },
      cifUsd: new Prisma.Decimal(createNewVersionDto.cifUsd),
      dollarRate: new Prisma.Decimal(createNewVersionDto.dollarRate),
      cifBrl: new Prisma.Decimal(cifBrl),
      tonnes: createNewVersionDto.tonnes ? new Prisma.Decimal(createNewVersionDto.tonnes) : null,
      cntrCount: createNewVersionDto.cntrCount || null,
      cntrType: createNewVersionDto.cntrType || null,
      storageCost: new Prisma.Decimal(createNewVersionDto.storageCost || 0),
      transportCost: new Prisma.Decimal(createNewVersionDto.transportCost || 0),
      discount: new Prisma.Decimal(createNewVersionDto.discount || 0),
      isCurrentVersion: true,
    };

    // Cria a nova versão
    const newSimulation = await this.prisma.simulation.create({
      data: dataNewVersion,
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            document: true,
          },
        },
      },
    });

    // Copia os serviços da versão anterior (opcional, pode ser feito manualmente)
    // Se quiser copiar automaticamente, descomente:
    /*
    if (baseSimulation.services.length > 0) {
      await this.prisma.simulationService.createMany({
        data: baseSimulation.services.map((service) => ({
          simulationId: newSimulation.id,
          serviceId: service.serviceId,
          costType: service.costType,
          originalCost: service.originalCost,
          appliedCost: service.appliedCost,
          customReason: service.customReason,
        })),
      });
    }
    */

    return newSimulation;
  }

  async findAll(userId?: string, customerId?: string) {
    const where: any = { isCurrentVersion: true }; // Só versões correntes

    if (customerId) {
      where.customerId = customerId;
    }

    return this.prisma.simulation.findMany({
      where,
      include: {
        customer: {
          select: {
            code: true,
            name: true,
            document: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                code: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!simulation) {
      throw new NotFoundException(`Simulação com ID ${id} não encontrada`);
    }

    return simulation;
  }

  async getVersionHistory(simulationNumber: string) {
    return this.prisma.simulation.findMany({
      where: { simulationNumber },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  async update(id: string, updateSimulationDto: UpdateSimulationDto) {
    await this.findOne(id); // Verifica se existe

    // Prepara dados de atualização com conversões
    const updateData: any = {};

    if (updateSimulationDto.customerId) {
      updateData.customerId = updateSimulationDto.customerId;
    }

    if (updateSimulationDto.cifUsd !== undefined) {
      updateData.cifUsd = new Prisma.Decimal(updateSimulationDto.cifUsd);
    }

    if (updateSimulationDto.dollarRate !== undefined) {
      updateData.dollarRate = new Prisma.Decimal(updateSimulationDto.dollarRate);
    }

    if (updateSimulationDto.tonnes !== undefined) {
      updateData.tonnes = updateSimulationDto.tonnes ? new Prisma.Decimal(updateSimulationDto.tonnes) : null;
    }

    if (updateSimulationDto.cntrCount !== undefined) {
      updateData.cntrCount = updateSimulationDto.cntrCount || null;
    }

    if (updateSimulationDto.cntrType !== undefined) {
      updateData.cntrType = updateSimulationDto.cntrType || null;
    }

    if (updateSimulationDto.storageCost !== undefined) {
      updateData.storageCost = new Prisma.Decimal(updateSimulationDto.storageCost);
    }

    if (updateSimulationDto.transportCost !== undefined) {
      updateData.transportCost = new Prisma.Decimal(updateSimulationDto.transportCost);
    }

    if (updateSimulationDto.discount !== undefined) {
      updateData.discount = new Prisma.Decimal(updateSimulationDto.discount);
    }

    if (updateSimulationDto.status) {
      updateData.status = updateSimulationDto.status;
    }

    // Recalcula CIF BRL se necessário
    if (updateSimulationDto.cifUsd !== undefined || updateSimulationDto.dollarRate !== undefined) {
      const current = await this.prisma.simulation.findUnique({ where: { id } });
      if (current) {
        const newCifUsd = updateSimulationDto.cifUsd ?? Number(current.cifUsd);
        const newDollarRate = updateSimulationDto.dollarRate ?? Number(current.dollarRate);
        updateData.cifBrl = new Prisma.Decimal(newCifUsd * newDollarRate);
      }
    }

    return this.prisma.simulation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const simulation = await this.findOne(id);

    // Só permite deletar simulações em status DRAFT
    if (simulation.status !== 'DRAFT') {
      throw new BadRequestException(
        `Não é possível deletar simulação com status ${simulation.status}. ` +
        `Apenas simulações em DRAFT podem ser deletadas. ` +
        `Para simulações aprovadas/enviadas, crie uma nova versão ao invés de deletar.`,
      );
    }

    return this.prisma.simulation.delete({
      where: { id },
    });
  }

  // ========== GERENCIAMENTO DE SERVIÇOS ==========

  async addService(simulationId: string, dto: AddSimulationServiceDto, userId: string) {
    const simulation = await this.findOne(simulationId);

    // Verifica se o serviço existe e busca o tipo de cálculo
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Serviço com ID ${dto.serviceId} não encontrado`);
    }

    // Busca o custo (taxa) vigente do serviço
    const currentCost = await this.prisma.serviceCost.findFirst({
      where: {
        serviceId: dto.serviceId,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      orderBy: { validFrom: 'desc' },
    });

    if (!currentCost && dto.costType === ServiceCostType.DEFAULT) {
      throw new BadRequestException(`Serviço ${service.name} não possui custo vigente cadastrado`);
    }

    const rate = Number(currentCost?.cost || 0); // Taxa base (não é valor final)
    let appliedCost: number;

    // Calcula o custo baseado no tipo
    if (dto.costType === ServiceCostType.DEFAULT) {
      // Valida se a simulação tem os dados necessários para o tipo de cálculo
      this.calculationService.validateSimulationData(service.calculationType, {
        cifBrl: Number(simulation.cifBrl),
        cntrCount: simulation.cntrCount || undefined,
        tonnes: simulation.tonnes ? Number(simulation.tonnes) : undefined,
      });

      // Calcula o custo usando o CalculationService
      appliedCost = this.calculationService.calculateServiceCost(
        service.calculationType,
        rate,
        {
          cifBrl: Number(simulation.cifBrl),
          cntrCount: simulation.cntrCount || undefined,
          tonnes: simulation.tonnes ? Number(simulation.tonnes) : undefined,
        },
      );
    } else if (dto.costType === ServiceCostType.ZEROED) {
      appliedCost = 0;
    } else if (dto.costType === ServiceCostType.CUSTOM) {
      // Validação: se CUSTOM, precisa ter motivo e valor
      if (!dto.customReason) {
        throw new BadRequestException('Custo customizado requer motivo (customReason)');
      }
      if (dto.appliedCost === undefined || dto.appliedCost === null) {
        throw new BadRequestException('Custo customizado requer valor (appliedCost)');
      }
      appliedCost = dto.appliedCost;
    } else {
      appliedCost = dto.appliedCost || 0;
    }

    // Upsert: cria ou atualiza se já existir
    const simulationService = await this.prisma.simulationService.upsert({
      where: {
        simulationId_serviceId: {
          simulationId,
          serviceId: dto.serviceId,
        },
      },
      create: {
        simulationId,
        serviceId: dto.serviceId,
        costType: dto.costType,
        originalCost: new Prisma.Decimal(rate), // Taxa base
        appliedCost: new Prisma.Decimal(appliedCost), // Valor calculado
        customReason: dto.customReason || null,
      },
      update: {
        costType: dto.costType,
        originalCost: new Prisma.Decimal(rate), // Taxa base
        appliedCost: new Prisma.Decimal(appliedCost), // Valor calculado
        customReason: dto.customReason || null,
      },
      include: {
        service: true,
      },
    });

    // Recalcula os totalizadores
    await this.recalculateTotals(simulationId);

    return simulationService;
  }

  async removeService(simulationId: string, serviceId: string) {
    await this.findOne(simulationId); // Verifica se simulação existe

    const simulationService = await this.prisma.simulationService.findUnique({
      where: {
        simulationId_serviceId: {
          simulationId,
          serviceId,
        },
      },
    });

    if (!simulationService) {
      throw new NotFoundException(`Serviço não encontrado na simulação`);
    }

    await this.prisma.simulationService.delete({
      where: {
        simulationId_serviceId: {
          simulationId,
          serviceId,
        },
      },
    });

    // Recalcula os totalizadores
    await this.recalculateTotals(simulationId);

    return { message: 'Serviço removido com sucesso' };
  }

  async getServices(simulationId: string) {
    await this.findOne(simulationId); // Verifica se existe

    return this.prisma.simulationService.findMany({
      where: { simulationId },
      include: {
        service: true,
      },
      orderBy: {
        service: {
          code: 'asc',
        },
      },
    });
  }

  private async recalculateTotals(simulationId: string) {
    const services = await this.prisma.simulationService.findMany({
      where: { simulationId },
    });

    const totalServices = services.reduce((sum, s) => sum + Number(s.appliedCost), 0);

    // Busca custos adicionais
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
    });

    if (!simulation) {
      throw new NotFoundException(`Simulação com ID ${simulationId} não encontrada`);
    }

    const storageCost = Number(simulation.storageCost || 0);
    const transportCost = Number(simulation.transportCost || 0);
    const discount = Number(simulation.discount || 0);

    const totalGeneral = totalServices + storageCost + transportCost - discount;

    await this.prisma.simulation.update({
      where: { id: simulationId },
      data: {
        totalServices: new Prisma.Decimal(totalServices),
        totalGeneral: new Prisma.Decimal(totalGeneral),
      },
    });
  }
}
