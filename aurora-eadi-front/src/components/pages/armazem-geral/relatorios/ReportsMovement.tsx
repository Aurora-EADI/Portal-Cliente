"use client";

import { useMemo, useState } from "react";
import { DataTable, PageHeader, Column } from "@/components/ui/DataTable";
import { ArrowDownUp } from "lucide-react";
import { ReportFilters } from "./components/ReportFilters";
import { ReportExportActions } from "./components/ReportExportActions";
import { useContainersList } from "@/hooks/armazem-geral/useContainers";
import { parseLocalDate } from "@/lib/exportExcel";

export function ReportsMovement() {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: containersData, isLoading } = useContainersList({
    customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined,
    // Note: No backend we can add date filters too if needed
  });

  const columns: Column<any>[] = [
    {
      key: "containerNumber",
      header: "Container",
      render: (item) => <span className="font-bold">{item.containerNumber}</span>,
    },
    {
      key: "customer",
      header: "Cliente",
      render: (item) => item.customer?.name || "—",
    },
    {
      key: "entryDate",
      header: "Data Entrada",
      render: (item) => parseLocalDate(item.entryDate),
    },
    {
      key: "exitDate",
      header: "Data Saída",
      render: (item) => parseLocalDate(item.exitDate),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
          item.exitDate ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
        }`}>
          {item.exitDate ? "SAÍDO" : "EM PÁTIO"}
        </span>
      ),
    },
  ];

  const exportColumns = [
    { header: "Container", key: "containerNumber" },
    { header: "Cliente", key: "customerName" }, // We'll flat this for export
    { header: "Entrada", key: "entryDateFmt" },
    { header: "Saída", key: "exitDateFmt" },
    { header: "Status", key: "statusLabel" },
  ];

  const exportData = useMemo(() => {
    const items = Array.isArray(containersData) ? containersData : (containersData as any)?.data || [];
    return items.map((item: any) => ({
      ...item,
      customerName: item.customer?.name || "—",
      entryDateFmt: parseLocalDate(item.entryDate),
      exitDateFmt: parseLocalDate(item.exitDate),
      statusLabel: item.exitDate ? "SAÍDO" : "EM PÁTIO",
    }));
  }, [containersData]);

  const handleClearFilters = () => {
    setSelectedCustomers([]);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="Relatório de Entrada e Saída"
        description="Movimentação detalhada de containers no período."
        actions={
          <ReportExportActions 
            data={exportData}
            columns={exportColumns}
            filename="movimentacao-ag"
            title="RELATÓRIO DE MOVIMENTAÇÃO - ENTRADA E SAÍDA"
            subtitle={`Período: ${startDate || "Início"} até ${endDate || "Hoje"}`}
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={exportData}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhuma movimentação encontrada para os filtros selecionados."
        />
      </div>
    </div>
  );
}
