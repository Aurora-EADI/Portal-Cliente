import { Injectable } from "@nestjs/common";
import {
  DamageStatus,
  OperationalContainerStatus,
  Prisma,
  TransshipmentStatus,
  WarehouseOwnedContainerStatus,
} from "@prisma/client";
import { PrismaPostgresService } from "../../prisma/prisma.service";
import { ArmazemGeralContextService } from "../armazem-geral-context.service";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 0, 0, 0, 0);
}

function monthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

@Injectable()
export class WarehouseGeneralDashboardService {
  constructor(
    private readonly prisma: PrismaPostgresService,
    private readonly context: ArmazemGeralContextService,
  ) {}

  async overview() {
    const warehouseId = await this.context.getWarehouseId();

    const [
      containerByStatus,
      ownedByStatus,
      openDamages,
      pendingTransshipments,
      cargosTotal,
    ] = await Promise.all([
      this.prisma.operationalContainer.groupBy({
        by: ["status"],
        where: { warehouseId },
        _count: { status: true },
      }),
      this.prisma.warehouseOwnedContainer.groupBy({
        by: ["status"],
        where: { warehouseId },
        _count: { status: true },
      }),
      this.prisma.warehouseDamage.count({
        where: { warehouseId, status: DamageStatus.OPEN },
      }),
      this.prisma.warehouseTransshipment.count({
        where: { warehouseId, status: TransshipmentStatus.PENDING },
      }),
      this.prisma.warehouseCargo.count({ where: { warehouseId } }),
    ]);

    const containers = containerByStatus.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<OperationalContainerStatus, number>,
    );

    const warehouseContainers = ownedByStatus.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<WarehouseOwnedContainerStatus, number>,
    );

    return {
      containers,
      warehouseContainers,
      openDamages,
      pendingTransshipments,
      cargosTotal,
    };
  }

  async kpis(params?: { year?: number; month?: number }) {
    const warehouseId = await this.context.getWarehouseId();

    const now = new Date();
    const year = params?.year ?? now.getFullYear();
    const monthIndex = (params?.month ?? now.getMonth() + 1) - 1;

    const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const nextMonthStart = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

    const [
      totalEntriesMonth,
      totalExitsMonth,
      totalTransshipmentsMonth,
      patioOrigin,
      patioOwned,
      originDamaged,
      ownedDamaged,
    ] = await Promise.all([
      this.prisma.operationalContainer.count({
        where: {
          warehouseId,
          entryDate: { gte: monthStart, lt: nextMonthStart },
        },
      }),
      this.prisma.operationalContainer.count({
        where: {
          warehouseId,
          exitDate: { gte: monthStart, lt: nextMonthStart },
        },
      }),
      this.prisma.warehouseTransshipment.count({
        where: {
          warehouseId,
          createdAt: { gte: monthStart, lt: nextMonthStart },
        },
      }),
      this.prisma.operationalContainer.count({
        where: { warehouseId, status: OperationalContainerStatus.IN_WAREHOUSE },
      }),
      this.prisma.warehouseOwnedContainer.count({
        where: {
          warehouseId,
          status: { not: WarehouseOwnedContainerStatus.WITH_CUSTOMER },
        },
      }),
      this.prisma.warehouseDamage.groupBy({
        by: ["containerId"],
        where: {
          warehouseId,
          status: DamageStatus.OPEN,
          containerId: { not: null },
          container: {
            warehouseId,
            status: OperationalContainerStatus.IN_WAREHOUSE,
          },
        },
      }),
      this.prisma.warehouseDamage.groupBy({
        by: ["ownedContainerId"],
        where: {
          warehouseId,
          status: DamageStatus.OPEN,
          ownedContainerId: { not: null },
          ownedContainer: {
            warehouseId,
            status: { not: WarehouseOwnedContainerStatus.WITH_CUSTOMER },
          },
        },
      }),
    ]);

    return {
      period: { year, month: monthIndex + 1 },
      totalEntriesMonth,
      totalExitsMonth,
      totalTransshipmentsMonth,
      totalContainersInPatio: patioOrigin + patioOwned,
      totalContainersWithDamageInPatio: originDamaged.length + ownedDamaged.length,
    };
  }

  async topCustomers(params?: { limit?: number }) {
    const warehouseId = await this.context.getWarehouseId();
    const limit = Math.max(1, Math.min(params?.limit ?? 5, 20));

    const grouped = await this.prisma.operationalContainer.groupBy({
      by: ["customerId"],
      where: {
        warehouseId,
        status: OperationalContainerStatus.IN_WAREHOUSE,
        customerId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    const customerIds = grouped.map((g) => g.customerId).filter(Boolean) as string[];
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true },
    });

    const nameById = new Map(customers.map((c) => [c.id, c.name]));

    return grouped.map((g) => ({
      customerId: g.customerId,
      customerName: g.customerId ? nameById.get(g.customerId) ?? "—" : "—",
      total: g._count.id,
    }));
  }

  async patioDistribution() {
    const warehouseId = await this.context.getWarehouseId();

    const [
      originTotal,
      ownedTotal,
      originFull,
      ownedFull,
      originDamaged,
      ownedDamaged,
    ] = await Promise.all([
      this.prisma.operationalContainer.count({
        where: { warehouseId, status: OperationalContainerStatus.IN_WAREHOUSE },
      }),
      this.prisma.warehouseOwnedContainer.count({
        where: {
          warehouseId,
          status: { not: WarehouseOwnedContainerStatus.WITH_CUSTOMER },
        },
      }),
      this.prisma.operationalContainer.count({
        where: {
          warehouseId,
          status: OperationalContainerStatus.IN_WAREHOUSE,
          cargos: { some: { exitDate: null } },
        },
      }),
      this.prisma.warehouseOwnedContainer.count({
        where: {
          warehouseId,
          status: { not: WarehouseOwnedContainerStatus.WITH_CUSTOMER },
          warehouseCargos: { some: { exitDate: null } },
        },
      }),
      this.prisma.operationalContainer.count({
        where: {
          warehouseId,
          status: OperationalContainerStatus.IN_WAREHOUSE,
          damages: { some: { status: DamageStatus.OPEN } },
        },
      }),
      this.prisma.warehouseOwnedContainer.count({
        where: {
          warehouseId,
          status: { not: WarehouseOwnedContainerStatus.WITH_CUSTOMER },
          damages: { some: { status: DamageStatus.OPEN } },
        },
      }),
    ]);

    const total = originTotal + ownedTotal;
    const full = originFull + ownedFull;
    const withDamage = originDamaged + ownedDamaged;

    return {
      totals: {
        total,
        origin: originTotal,
        owned: ownedTotal,
      },
      occupancy: {
        full,
        fullOrigin: originFull,
        fullOwned: ownedFull,
        empty: Math.max(0, total - full),
        emptyOrigin: Math.max(0, originTotal - originFull),
        emptyOwned: Math.max(0, ownedTotal - ownedFull),
      },
      damage: {
        withDamage,
        withoutDamage: Math.max(0, total - withDamage),
      },
    };
  }

  async transshipmentsMonthly(params?: { months?: number }) {
    const warehouseId = await this.context.getWarehouseId();
    const months = Math.max(3, Math.min(params?.months ?? 12, 24));

    const now = new Date();
    const end = addMonths(startOfMonth(now), 1);
    const start = addMonths(startOfMonth(now), -(months - 1));

    const rows = await this.prisma.$queryRaw<
      { month: Date; total: number }[]
    >(Prisma.sql`
      select date_trunc('month', "createdAt") as month,
             count(*)::int as total
      from "warehouse_transshipments"
      where "warehouseId" = ${warehouseId}
        and "createdAt" >= ${start}
        and "createdAt" < ${end}
      group by 1
      order by 1 asc
    `);

    const byKey = new Map(rows.map((r) => [monthKey(new Date(r.month)), r.total]));

    const series = [];
    for (let i = 0; i < months; i++) {
      const monthDate = addMonths(start, i);
      const key = monthKey(monthDate);
      series.push({ month: key, total: byKey.get(key) ?? 0 });
    }

    return { months: series };
  }

  async demurrage(params?: { days?: number; limit?: number }) {
    const warehouseId = await this.context.getWarehouseId();
    const days = Math.max(1, Math.min(params?.days ?? 7, 30));
    const limit = Math.max(10, Math.min(params?.limit ?? 50, 200));

    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.operationalContainer.findMany({
      where: {
        warehouseId,
        status: OperationalContainerStatus.IN_WAREHOUSE,
        freeTimeDate: { not: null, lte: end },
      },
      orderBy: { freeTimeDate: "asc" },
      take: limit,
      select: {
        id: true,
        containerNumber: true,
        containerType: true,
        location: true,
        entryDate: true,
        freeTimeDate: true,
        customer: { select: { id: true, name: true, document: true } },
      },
    });

    return {
      days,
      data: rows.map((r) => {
        const freeTimeDate = r.freeTimeDate as Date;
        const diffDays = Math.ceil((freeTimeDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        return {
          id: r.id,
          containerNumber: r.containerNumber,
          containerType: r.containerType,
          location: r.location,
          entryDate: r.entryDate,
          freeTimeDate: r.freeTimeDate,
          customer: r.customer,
          daysRemaining: diffDays,
          isOverdue: diffDays < 0,
        };
      }),
    };
  }
}
