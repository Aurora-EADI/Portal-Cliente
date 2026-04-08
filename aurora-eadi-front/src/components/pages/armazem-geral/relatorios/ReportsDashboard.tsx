"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  ArrowDownUp, 
  LayoutGrid, 
  TrendingUp, 
  Package, 
  Users,
  PieChart
} from "lucide-react";
import { ReportFilters } from "./components/ReportFilters";
import { ReportExportActions } from "./components/ReportExportActions";
import { 
  useDashboardKpis, 
  useDashboardTopCustomers, 
  useDashboardPatioDistribution, 
  useDashboardTransshipmentsMonthly 
} from "@/hooks/armazem-geral/useDashboard";
import { TopCustomersBarChart } from "../dashboard/components/TopCustomersBarChart";
import { PatioDistributionPieChart } from "../dashboard/components/PatioDistributionPieChart";
import { TransshipmentsMonthlyLineChart } from "../dashboard/components/TransshipmentsMonthlyLineChart";
import { StatusCards, StatusCardConfig } from "@/components/ui/DataTable";

export function ReportsDashboard() {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Hooks de dados (Ganhando suporte a filtros de clientes)
  const { data: kpis, isLoading: isKpisLoading } = useDashboardKpis({ 
    customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined 
  });
  const { data: topCustomers, isLoading: isTopCustomersLoading } = useDashboardTopCustomers({ 
    limit: 5, 
    customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined 
  });
  const { data: patioDist, isLoading: isPatioDistLoading } = useDashboardPatioDistribution({ 
    customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined 
  });
  const { data: transshipments, isLoading: isTransshipmentsLoading } = useDashboardTransshipmentsMonthly({ 
    months: 12, 
    customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined 
  });

  const KPI_CARDS: StatusCardConfig[] = [
    {
      status: "entries",
      label: "Entradas (Mês)",
      icon: ArrowDownUp,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-700",
    },
    {
      status: "patio",
      label: "Em Pátio",
      icon: Package,
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    {
      status: "exits",
      label: "Saídas (Mês)",
      icon: ArrowDownUp,
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
    },
    {
      status: "transshipments",
      label: "Transbordos",
      icon: TrendingUp,
      bgColor: "bg-violet-100",
      textColor: "text-violet-700",
    },
  ];

  const kpiCounts = {
    entries: kpis?.totalEntriesMonth ?? 0,
    patio: kpis?.totalContainersInPatio ?? 0,
    exits: kpis?.totalExitsMonth ?? 0,
    transshipments: kpis?.totalTransshipmentsMonth ?? 0,
  };

  const topCustomersChart = useMemo(() => {
    return (topCustomers ?? []).map((c) => ({
      label: c.customerName || "—",
      value: c.total,
    }));
  }, [topCustomers]);

  const patioDatasets = useMemo(() => ({
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
  }), [patioDist]);

  const exportColumns = [
    { header: "Indicador", key: "label" },
    { header: "Valor", key: "value" },
  ];

  const exportData = [
    { label: "Entradas no Mês", value: kpis?.totalEntriesMonth ?? 0 },
    { label: "Saídas no Mês", value: kpis?.totalExitsMonth ?? 0 },
    { label: "Total em Pátio", value: kpis?.totalContainersInPatio ?? 0 },
    { label: "Transbordos no Mês", value: kpis?.totalTransshipmentsMonth ?? 0 },
  ];

  const handleClearFilters = () => {
    setSelectedCustomers([]);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="Visão Geral - Relatórios"
        description="Acompanhamento analítico da operação de Armazém Geral."
        actions={
          <ReportExportActions 
            data={exportData}
            columns={exportColumns}
            filename="dashboard-geral-ag"
            title="RESUMO OPERACIONAL - ARMAZÉM GERAL"
            subtitle={selectedCustomers.length > 0 ? "Filtro aplicado: Clientes Selecionados" : "Todos os Clientes"}
          />
        }
      />

      <ReportFilters 
        selectedCustomers={selectedCustomers}
        onCustomersChange={setSelectedCustomers}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onClear={handleClearFilters}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-2">
             <BarChart3 className="w-4 h-4 text-orange-500" />
             Indicadores Operacionais
          </h2>
        </div>
        <StatusCards
          cards={KPI_CARDS}
          statusCounts={kpiCounts}
          activeStatus=""
          onStatusClick={() => {}}
          columns={4}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Users className="w-4 h-4 text-blue-600" />
              Volume por Cliente (TEUs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopCustomersBarChart data={topCustomersChart} isLoading={isTopCustomersLoading} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Distribuição do Pátio
            </CardTitle>
          </CardHeader>
          <CardContent>
             <PatioDistributionPieChart mode="occupancy" datasets={patioDatasets} isLoading={isPatioDistLoading} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            Tendência Mensal de Transbordos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransshipmentsMonthlyLineChart 
            data={transshipments?.months ?? []} 
            isLoading={isTransshipmentsLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
