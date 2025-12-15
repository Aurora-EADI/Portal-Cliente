import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaPostgresService } from '../prisma/prisma.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { CreateNewVersionDto } from './dto/create-new-version.dto';
import { AddSimulationServiceDto } from './dto/add-simulation-service.dto';
import { ServiceCostType } from '@prisma/client-postgres';

@Injectable()
export class SimulationsService {
  constructor(private readonly prisma: PrismaPostgresService) {}

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
    // Verifica se o fornecedor existe
    const supplier = await this.prisma.company.findUnique({
      where: { id: createSimulationDto.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException(`Fornecedor com ID ${createSimulationDto.supplierId} não encontrado`);
    }

    const simulationNumber = this.generateSimulationNumber();
    const displayNumber = this.generateDisplayNumber(simulationNumber, 1);

    // Calcula CIF BRL
    const cifBrl = createSimulationDto.cifUsd * createSimulationDto.dollarRate;

    return this.prisma.simulation.create({
      data: {
        simulationNumber,
        version: 1,
        displayNumber,
        supplierId: createSimulationDto.supplierId,
        cifUsd: createSimulationDto.cifUsd,
        dollarRate: createSimulationDto.dollarRate,
        cifBrl,
        tonnes: createSimulationDto.tonnes,
        cntrCount: createSimulationDto.cntrCount,
        cntrType: createSimulationDto.cntrType,
        storageCost: createSimulationDto.storageCost || 0,
        transportCost: createSimulationDto.transportCost || 0,
        discount: createSimulationDto.discount || 0,
        createdBy: userId,
      },
      include: {
        supplier: {
          select: {
            id: true,
            fantasyName: true,
            socialReason: true,
            cnpj: true,
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

    // Cria a nova versão
    const newSimulation = await this.prisma.simulation.create({
      data: {
        simulationNumber: baseSimulation.simulationNumber,
        version: newVersion,
        displayNumber,
        baseSimulationId: createNewVersionDto.baseSimulationId,
        versionReason: createNewVersionDto.versionReason,
        supplierId: createNewVersionDto.supplierId,
        cifUsd: createNewVersionDto.cifUsd,
        dollarRate: createNewVersionDto.dollarRate,
        cifBrl,
        tonnes: createNewVersionDto.tonnes,
        cntrCount: createNewVersionDto.cntrCount,
        cntrType: createNewVersionDto.cntrType,
        storageCost: createNewVersionDto.storageCost || 0,
        transportCost: createNewVersionDto.transportCost || 0,
        discount: createNewVersionDto.discount || 0,
        isCurrentVersion: true,
        createdBy: userId,
      },
      include: {
        supplier: {
          select: {
            id: true,
            fantasyName: true,
            socialReason: true,
            cnpj: true,
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

  async findAll(userId?: string, supplierId?: string) {
    const where: any = { isCurrentVersion: true }; // Só versões correntes

    if (supplierId) {
      where.supplierId = supplierId;
    }

    return this.prisma.simulation.findMany({
      where,
      include: {
        supplier: {
          select: {
            fantasyName: true,
            socialReason: true,
            cnpj: true,
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
        supplier: true,
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

    // Recalcula CIF BRL se necessário
    let cifBrl: number | undefined;
    if (updateSimulationDto.cifUsd || updateSimulationDto.dollarRate) {
      const current = await this.prisma.simulation.findUnique({ where: { id } });
      if (current) {
        const newCifUsd = updateSimulationDto.cifUsd ?? current.cifUsd;
        const newDollarRate = updateSimulationDto.dollarRate ?? current.dollarRate;
        cifBrl = Number(newCifUsd) * Number(newDollarRate);
      }
    }

    return this.prisma.simulation.update({
      where: { id },
      data: {
        ...updateSimulationDto,
        ...(cifBrl !== undefined && { cifBrl }),
      },
      include: {
        supplier: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.simulation.delete({
      where: { id },
    });
  }

  // ========== GERENCIAMENTO DE SERVIÇOS ==========

  async addService(simulationId: string, dto: AddSimulationServiceDto, userId: string) {
    const simulation = await this.findOne(simulationId);

    // Verifica se o serviço existe
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Serviço com ID ${dto.serviceId} não encontrado`);
    }

    // Busca o custo vigente do serviço
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

    const originalCost = currentCost?.cost || 0;

    // Validação: se CUSTOM, precisa ter motivo
    if (dto.costType === ServiceCostType.CUSTOM && !dto.customReason) {
      throw new BadRequestException('Custo customizado requer motivo (customReason)');
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
        originalCost,
        appliedCost: dto.appliedCost,
        customReason: dto.customReason,
      },
      update: {
        costType: dto.costType,
        originalCost,
        appliedCost: dto.appliedCost,
        customReason: dto.customReason,
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
        totalServices,
        totalGeneral,
      },
    });
  }
}
