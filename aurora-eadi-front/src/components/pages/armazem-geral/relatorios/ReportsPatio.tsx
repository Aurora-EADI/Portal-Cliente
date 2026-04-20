"use client";

import { useMemo, useState } from "react";
import { DataTable, PageHeader, Column } from "@/components/ui/DataTable";
import { LayoutGrid, MapPin } from "lucide-react";
import { ReportFilters } from "./components/ReportFilters";
import { ReportExportActions } from "./components/ReportExportActions";
import { usePatioContainers } from "@/hooks/armazem-geral/usePatioContainers";
import { parseLocalDate } from "@/lib/exportExcel";

export function ReportsPatio() {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: patioData, isLoading } = usePatioContainers({
    customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined,
  });

  const columns: Column<any>[] = [
    {
      key: "containerNumber",
      header: "Container",
      render: (item) => <span className="font-bold text-slate-900">{item.containerNumber}</span>,
    },
    {
      key: "customer",
      header: "Cliente",
      render: (item) => item.customer?.name || "—",
    },
    {
      key: "entryDate",
      header: "Entrada em Pátio",
      render: (item) => parseLocalDate(item.entryDate),
    },
    {
      key: "location",
      header: "Localização",
      render: (item) => (
        <span className="flex items-center gap-2 text-blue-600 font-medium">
          <MapPin className="w-3.5 h-3.5" />
          {item.location || "N/A"}
        </span>
      ),
    },
    {
        key: "isFull",
        header: "Carga",
        render: (item) => (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            item.cargoId ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
          }`}>
            {item.cargoId ? "CHEIO" : "VAZIO"}
          </span>
        ),
      },
  ];

  const exportColumns = [
    { header: "Container", key: "containerNumber" },
    { header: "Cliente", key: "customerName" },
    { header: "Entrada", key: "entryDateFmt" },
    { header: "Localização", key: "location" },
    { header: "Status Carga", key: "cargoStatus" },
  ];

  const exportData = useMemo(() => {
    const items = Array.isArray(patioData) ? patioData : (patioData as any)?.data || [];
    return items.map((item: any) => ({
      ...item,
      customerName: item.customer?.name || "—",
      entryDateFmt: parseLocalDate(item.entryDate),
      cargoStatus: item.cargoId ? "CHEIO" : "VAZIO",
    }));
  }, [patioData]);

  const handleClearFilters = () => {
    setSelectedCustomers([]);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="Posição de Pátio (Inventário)"
        description="Relação de containers atualmente no pátio do Armazém Geral."
        actions={
          <ReportExportActions 
            data={exportData}
            columns={exportColumns}
            filename="posicao-patio-ag"
            title="INVENTÁRIO DE PÁTIO - ARMAZÉM GERAL"
            subtitle={`Total de Unidades: ${exportData.length}`}
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
          emptyMessage="Não há containers em pátio no momento para os filtros selecionados."
        />
      </div>
    </div>
  );
}
