import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaPostgresService } from "../prisma/prisma.service";
import { CreateFlightDto } from "./dto/create-flight.dto";
import { UpdateFlightDto } from "./dto/update-flight.dto";
import { CreateCargoItemsDto } from "./dto/create-cargo-items.dto";
import { UpdateCargoItemDto } from "./dto/update-cargo-item.dto";
import { RevertFlightDto } from "./dto/revert-flight.dto";
import {
  FlightStatus,
  CargoItemStatus,
  FlightHistoryType,
} from "@prisma/client";

@Injectable()
export class CcteService {
  constructor(private readonly prisma: PrismaPostgresService) {}

  // ========== FLIGHTS ==========

  async findAllFlights(search?: string, status?: string) {
    const where: any = {};

    if (status) {
      where.status = status as FlightStatus;
    }

    if (search) {
      const term = search.toUpperCase();
      where.OR = [
        { flightCode: { contains: term, mode: "insensitive" } },
        { aircraftName: { contains: term, mode: "insensitive" } },
        {
          cargoItems: {
            some: {
              OR: [
                { house: { contains: term, mode: "insensitive" } },
                { importer: { contains: term, mode: "insensitive" } },
                { dta: { contains: term, mode: "insensitive" } },
                { responsible: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
        { termoEntrada: { contains: term, mode: "insensitive" } },
      ];
    }

    const flights = await this.prisma.flight.findMany({
      where,
      include: {
        _count: { select: { cargoItems: true } },
        cargoItems: { select: { dta: true } },
      },
      orderBy: { arrivalDate: "desc" },
    });

    return flights.map(({ cargoItems, ...flight }) => ({
      ...flight,
      dtaFilledCount: cargoItems.filter(
        (item) => item.dta && item.dta.trim() !== "",
      ).length,
    }));
  }

  async findOneFlight(id: string) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: {
        cargoItems: { orderBy: { house: "asc" } },
        history: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!flight) {
      throw new NotFoundException("Voo nao encontrado");
    }

    return flight;
  }

  async createFlight(dto: CreateFlightDto) {
    return this.prisma.flight.create({
      data: {
        aircraftName: dto.aircraftName,
        arrivalDate: new Date(dto.arrivalDate + "T00:00:00"),
        arrivalTime: dto.arrivalTime,
        flightCode: dto.flightCode,
        termoEntrada: dto.termoEntrada,
        status: FlightStatus.PENDING,
      },
    });
  }

  async updateFlight(id: string, dto: UpdateFlightDto) {
    const flight = await this.prisma.flight.findUnique({ where: { id } });

    if (!flight) {
      throw new NotFoundException("Voo nao encontrado");
    }

    if (flight.status === FlightStatus.SENT) {
      throw new BadRequestException(
        "Nao e possivel editar um voo com status ENVIADO",
      );
    }

    const changedFields: string[] = [];
    const updateData: any = {};

    if (dto.aircraftName && dto.aircraftName !== flight.aircraftName) {
      changedFields.push("Nome do Aviao");
      updateData.aircraftName = dto.aircraftName;
    }
    if (dto.flightCode && dto.flightCode !== flight.flightCode) {
      changedFields.push("Codigo do Voo");
      updateData.flightCode = dto.flightCode;
    }
    if (dto.arrivalDate) {
      const newDate = new Date(dto.arrivalDate + "T00:00:00");
      if (newDate.getTime() !== flight.arrivalDate.getTime()) {
        changedFields.push("Data de Chegada");
        updateData.arrivalDate = newDate;
      }
    }
    if (
      dto.termoEntrada !== undefined &&
      dto.termoEntrada !== flight.termoEntrada
    ) {
      changedFields.push("Termo de Entrada");
      updateData.termoEntrada = dto.termoEntrada;
    }

    const changes =
      changedFields.length > 0
        ? `Campos alterados: ${changedFields.join(", ")}`
        : "Nenhum campo alterado";

    return this.prisma.$transaction(async (tx) => {
      await tx.flightHistory.create({
        data: {
          flightId: id,
          type: FlightHistoryType.EDIT,
          changes,
          reason: dto.reason,
        },
      });

      return tx.flight.update({
        where: { id },
        data: updateData,
        include: {
          cargoItems: { orderBy: { house: "asc" } },
          history: { orderBy: { createdAt: "desc" } },
        },
      });
    });
  }

  async deleteFlight(id: string) {
    const flight = await this.prisma.flight.findUnique({ where: { id } });

    if (!flight) {
      throw new NotFoundException("Voo nao encontrado");
    }

    await this.prisma.flight.delete({ where: { id } });

    return { message: "Voo excluido com sucesso" };
  }

  async markFlightSent(id: string) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: { cargoItems: true },
    });

    if (!flight) {
      throw new NotFoundException("Voo nao encontrado");
    }

    if (flight.status === FlightStatus.SENT) {
      throw new BadRequestException("Este voo ja esta marcado como ENVIADO");
    }

    if (flight.cargoItems.length === 0) {
      throw new BadRequestException(
        "O voo deve ter pelo menos 1 carga para ser marcado como enviado",
      );
    }

    const itemsWithoutDta = flight.cargoItems.filter(
      (item) => !item.dta || item.dta.trim() === "",
    );

    if (itemsWithoutDta.length > 0) {
      throw new BadRequestException(
        `Existem ${itemsWithoutDta.length} cargas sem DTA preenchido. Todas as cargas devem ter DTA para marcar o voo como enviado.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.cargoItem.updateMany({
        where: { flightId: id },
        data: {
          sent: true,
          status: CargoItemStatus.ENVIADO,
        },
      });

      return tx.flight.update({
        where: { id },
        data: { status: FlightStatus.SENT },
        include: {
          cargoItems: { orderBy: { house: "asc" } },
          history: { orderBy: { createdAt: "desc" } },
        },
      });
    });
  }

  async revertFlight(id: string, dto: RevertFlightDto) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: { cargoItems: true },
    });

    if (!flight) {
      throw new NotFoundException("Voo nao encontrado");
    }

    if (flight.status !== FlightStatus.SENT) {
      throw new BadRequestException(
        "Apenas voos com status ENVIADO podem ser revertidos",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.flightHistory.create({
        data: {
          flightId: id,
          type: FlightHistoryType.REVERT,
          changes: "Voo revertido de ENVIADO para PENDENTE",
          reason: dto.reason,
        },
      });

      for (const item of flight.cargoItems) {
        const newStatus =
          item.dta && item.dta.trim() !== ""
            ? CargoItemStatus.DTA_REGISTRADA
            : CargoItemStatus.EM_ANALISE;

        await tx.cargoItem.update({
          where: { id: item.id },
          data: { sent: false, status: newStatus },
        });
      }

      return tx.flight.update({
        where: { id },
        data: { status: FlightStatus.PENDING },
        include: {
          cargoItems: { orderBy: { house: "asc" } },
          history: { orderBy: { createdAt: "desc" } },
        },
      });
    });
  }

  async getFlightHistory(id: string) {
    const flight = await this.prisma.flight.findUnique({ where: { id } });

    if (!flight) {
      throw new NotFoundException("Voo nao encontrado");
    }

    return this.prisma.flightHistory.findMany({
      where: { flightId: id },
      orderBy: { createdAt: "desc" },
    });
  }

  // ========== CARGO ITEMS ==========

  async createCargoItems(flightId: string, dto: CreateCargoItemsDto) {
    const items = dto.items.map((item) => {
      if (
        item.tc === "A" &&
        (!item.observations || item.observations.trim() === "")
      ) {
        throw new BadRequestException(
          `Observacoes sao obrigatorias quando o TC nao e P (Patio). Item House: ${item.house}`,
        );
      }

      const dtaValue = item.dta?.trim() || "";
      const status =
        dtaValue !== ""
          ? CargoItemStatus.DTA_REGISTRADA
          : CargoItemStatus.EM_ANALISE;

      return {
        flightId,
        house: item.house,
        importer: item.importer,
        dta: dtaValue,
        tc: item.tc,
        warehouseReason:
          item.tc === "A" ? (item.warehouseReason ?? null) : null,
        status,
        responsible: item.responsible || "",
        observations: item.observations || "",
        sent: false,
      };
    });

    await this.prisma.cargoItem.createMany({ data: items });

    return this.prisma.cargoItem.findMany({
      where: { flightId },
      orderBy: { house: "asc" },
    });
  }

  async updateCargoItem(id: string, dto: UpdateCargoItemDto) {
    const item = await this.prisma.cargoItem.findUnique({
      where: { id },
      include: { flight: true },
    });

    if (!item) {
      throw new NotFoundException("Carga nao encontrada");
    }

    if (item.flight.status === FlightStatus.SENT) {
      throw new BadRequestException(
        "Nao e possivel editar cargas de um voo ENVIADO",
      );
    }

    if (item.sent && dto.sent !== false) {
      throw new BadRequestException(
        "Nao e possivel editar uma carga ja enviada",
      );
    }

    const effectiveTc = dto.tc ?? item.tc;
    const effectiveObs = dto.observations ?? item.observations;

    if (effectiveTc === "A" && (!effectiveObs || effectiveObs.trim() === "")) {
      throw new BadRequestException(
        "Observacoes sao obrigatorias quando o TC nao e P (Patio)",
      );
    }

    const updateData: any = {};

    if (dto.house !== undefined) updateData.house = dto.house;
    if (dto.importer !== undefined) updateData.importer = dto.importer;
    if (dto.tc !== undefined) updateData.tc = dto.tc;
    if (dto.warehouseReason !== undefined)
      updateData.warehouseReason = dto.warehouseReason;
    if (dto.tc === "P") updateData.warehouseReason = null;
    if (dto.responsible !== undefined) updateData.responsible = dto.responsible;
    if (dto.observations !== undefined)
      updateData.observations = dto.observations;
    if (dto.sent !== undefined) updateData.sent = dto.sent;

    if (dto.dta !== undefined) {
      updateData.dta = dto.dta;
      const dtaTrimmed = dto.dta.trim();
      if (dtaTrimmed !== "") {
        updateData.status = CargoItemStatus.DTA_REGISTRADA;
      } else {
        updateData.status = CargoItemStatus.EM_ANALISE;
      }
    }

    if (dto.status !== undefined && dto.dta === undefined) {
      updateData.status = dto.status;
    }

    return this.prisma.cargoItem.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCargoItem(id: string) {
    const item = await this.prisma.cargoItem.findUnique({
      where: { id },
      include: { flight: true },
    });

    if (!item) {
      throw new NotFoundException("Carga nao encontrada");
    }

    if (item.flight.status === FlightStatus.SENT) {
      throw new BadRequestException(
        "Nao e possivel excluir cargas de um voo ENVIADO",
      );
    }

    await this.prisma.cargoItem.delete({ where: { id } });

    return { message: "Carga excluida com sucesso" };
  }

  async sendCargoItem(id: string) {
    const item = await this.prisma.cargoItem.findUnique({
      where: { id },
      include: { flight: true },
    });

    if (!item) {
      throw new NotFoundException("Carga nao encontrada");
    }

    if (item.flight.status === FlightStatus.SENT) {
      throw new BadRequestException("O voo ja esta marcado como ENVIADO");
    }

    if (!item.dta || item.dta.trim() === "") {
      throw new BadRequestException(
        "A carga deve ter DTA preenchido para ser enviada",
      );
    }

    if (item.sent) {
      throw new BadRequestException("Esta carga ja foi enviada");
    }

    return this.prisma.cargoItem.update({
      where: { id },
      data: {
        sent: true,
        status: CargoItemStatus.ENVIADO,
      },
    });
  }
}
