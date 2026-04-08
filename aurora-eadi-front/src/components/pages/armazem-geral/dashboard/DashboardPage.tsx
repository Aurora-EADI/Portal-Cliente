"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, PageHeader, StatusCardConfig, StatusCards } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertOctagon,
  ArrowDownRight,
  ArrowUpRight,
  CalendarArrowDown,
  CalendarArrowUp,
  Package,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useDashboardDemurrage,
  useDashboardKpis,
  useDashboardPatioDistribution,
  useDashboardTopCustomers,
  useDashboardTransshipmentsMonthly,
} from "@/hooks/armazem-geral/useDashboard";
import type { WarehouseDashboardDemurrageItem } from "@/types/armazem-geral";
import { PatioDistributionPieChart } from "./components/PatioDistributionPieChart";
import type { PatioDistributionMode } from "./components/PatioDistributionPieChart";
import { TopCustomersBarChart } from "./components/TopCustomersBarChart";
import { TransshipmentsMonthlyLineChart } from "./components/TransshipmentsMonthlyLineChart";

function toDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const fmtDate = (value: string | Date | null | undefined) => {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};

export function DashboardPage() {
  const router = useRouter();
  const [pieMode, setPieMode] = useState<PatioDistributionMode>("occupancy");

  const { data: kpis, isLoading: isKpisLoading } = useDashboardKpis();
  const { data: topCustomers, isLoading: isTopCustomersLoading } = useDashboardTopCustomers({ limit: 5 });
  const { data: patioDist, isLoading: isPatioDistLoading } = useDashboardPatioDistribution();
  const { data: transshipmentsMonthly, isLoading: isTransshipmentsMonthlyLoading } =
    useDashboardTransshipmentsMonthly({ months: 12 });
  const { data: demurrage, isLoading: isDemurrageLoading, isError: isDemurrageError } =
    useDashboardDemurrage({ days: 7, limit: 100 });

  const KPI_CARDS: StatusCardConfig[] = [
    {
      status: "entries-month",
      label: "Entradas no mês",
      icon: CalendarArrowDown,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-700",
    },
    {
      status: "patio-total",
      label: "Containers no pátio",
      icon: Package,
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    {
      status: "damages-patio",
      label: "Containers com avaria",
      icon: AlertOctagon,
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    },
    {
      status: "exits-month",
      label: "Saídas no mês",
      icon: CalendarArrowUp,
      bgColor: "bg-slate-100",
      textColor: "text-slate-700",
    },
    {
      status: "transshipments-month",
      label: "Transbordos no mês",
      icon: TrendingUp,
      bgColor: "bg-violet-100",
      textColor: "text-violet-700",
    },
  ];

  const kpiCounts = {
    "entries-month": kpis?.totalEntriesMonth ?? 0,
    "patio-total": kpis?.totalContainersInPatio ?? 0,
    "damages-patio": kpis?.totalContainersWithDamageInPatio ?? 0,
    "exits-month": kpis?.totalExitsMonth ?? 0,
    "transshipments-month": kpis?.totalTransshipmentsMonth ?? 0,
  };

  const onKpiClick = (id: string) => {
    switch (id) {
      case "entries-month":
      case "exits-month":
        router.push("/armazem-geral/containers");
        break;
      case "patio-total":
        router.push("/armazem-geral/patio");
        break;
      case "damages-patio":
        router.push("/armazem-geral/avarias");
        break;
      case "transshipments-month":
        router.push("/armazem-geral/transbordos");
        break;
      default:
        break;
    }
  };

  const topCustomersChart = useMemo(() => {
    const items = topCustomers ?? [];
    return items.map((c) => ({
      label: c.customerName || "—",
      value: c.total,
    }));
  }, [topCustomers]);

  const patioDatasets = useMemo(() => {
    return {
      occupancy: {
        full: patioDist?.occupancy?.full ?? 0,
        fullOrigin: patioDist?.occupancy?.fullOrigin ?? 0,
        fullOwned: patioDist?.occupancy?.fullOwned ?? 0,
        empty: patioDist?.occupancy?.empty ?? 0,
        emptyOrigin: patioDist?.occupancy?.emptyOrigin ?? 0,
        emptyOwned: patioDist?.occupancy?.emptyOwned ?? 0,
      },
      type: {
        origin: patioDist?.totals?.origin ?? 0,
        owned: patioDist?.totals?.owned ?? 0,
      },
      damage: {
        withDamage: patioDist?.damage?.withDamage ?? 0,
        withoutDamage: patioDist?.damage?.withoutDamage ?? 0,
      },
    };
  }, [patioDist]);

  const demurrageColumns: Column<WarehouseDashboardDemurrageItem>[] = useMemo(() => {
    return [
      {
        key: "container",
        header: "Container",
        render: (item) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{item.containerNumber}</span>
            {item.isOverdue ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                <ArrowDownRight className="h-3 w-3" />
                Vencido
              </span>
            ) : item.daysRemaining <= 3 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                <ArrowUpRight className="h-3 w-3" />
                {item.daysRemaining}d
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {item.daysRemaining}d
              </span>
            )}
          </div>
        ),
      },
      {
        key: "customer",
        header: "Cliente",
        render: (item) => item.customer?.name ?? "—",
      },
      {
        key: "entryDate",
        header: "Entrada",
        render: (item) => fmtDate(item.entryDate),
      },
      {
        key: "freeTimeDate",
        header: `Free time (${demurrage?.days ?? 7}d)`,
        render: (item) => fmtDate(item.freeTimeDate),
      },
      {
        key: "location",
        header: "Local",
        render: (item) => item.location ?? "—",
      },
    ];
  }, [demurrage?.days]);

  const demurrageRowClass = (item: WarehouseDashboardDemurrageItem) => {
    if (item.isOverdue) return "bg-red-50";
    if (item.daysRemaining <= 3) return "bg-amber-50";
    return "";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-8 pt-6">
      <PageHeader
        title="Dashboard — Armazém Geral"
        description="Visão geral operacional, ocupação de pátio, transbordos e demurrage."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
              <Users className="w-5 h-5 text-blue-600" />
              Top 5 clientes (containers no pátio)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopCustomersBarChart data={topCustomersChart} isLoading={isTopCustomersLoading} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="space-y-3">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
              <PieChart className="w-5 h-5 text-indigo-600" />
              Distribuição de containers no pátio
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPieMode("occupancy")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  pieMode === "occupancy"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Cheio/Vazio
              </button>
              <button
                onClick={() => setPieMode("type")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  pieMode === "type"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Origem/Cedido
              </button>
              <button
                onClick={() => setPieMode("damage")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  pieMode === "damage"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Avaria
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <PatioDistributionPieChart mode={pieMode} datasets={patioDatasets} isLoading={isPatioDistLoading} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Transbordos por mês (últimos 12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransshipmentsMonthlyLineChart
            data={transshipmentsMonthly?.months ?? []}
            isLoading={isTransshipmentsMonthlyLoading}
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Indicadores</h2>
          {isKpisLoading ? (
            <span className="text-xs text-gray-400">Carregando...</span>
          ) : kpis?.period ? (
            <span className="text-xs text-gray-500">
              Período: {String(kpis.period.month).padStart(2, "0")}/{kpis.period.year}
            </span>
          ) : null}
        </div>

        <StatusCards
          cards={KPI_CARDS}
          statusCounts={kpiCounts}
          activeStatus=""
          onStatusClick={onKpiClick}
          columns={5}
        />
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
            <Package className="w-5 h-5 text-amber-600" />
            Containers com demurrage (free time)
          </CardTitle>
          <p className="text-sm text-gray-500">
            Exibe vencidos e os que vencem em até {demurrage?.days ?? 7} dias.
          </p>
        </CardHeader>
        <CardContent>
          <DataTable<WarehouseDashboardDemurrageItem>
            columns={demurrageColumns}
            data={demurrage?.data ?? []}
            keyExtractor={(item) => item.id}
            isLoading={isDemurrageLoading}
            isError={demurrage ? false : isDemurrageError}
            errorMessage="Erro ao carregar containers com demurrage."
            emptyMessage="Nenhum container vencido ou vencendo no período."
            rowClassName={demurrageRowClass}
            onRowClick={() => router.push("/armazem-geral/containers")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
